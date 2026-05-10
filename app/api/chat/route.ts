import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 120;

// ── Paths ─────────────────────────────────────────────────────────────────────

const DELIVERY_ROOT = path.resolve(process.cwd(), "..");

function safePath(rel: string): string | null {
  const abs = path.resolve(DELIVERY_ROOT, rel);
  if (!abs.startsWith(DELIVERY_ROOT + path.sep) && abs !== DELIVERY_ROOT) return null;
  return abs;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "Read a file from the delivery system. Path is relative to delivery-system root.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "E.g. 'input/Others/HAYK/project-tracking.md'" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_dir",
    description: "List files and subdirectories at a path relative to delivery-system root.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "E.g. 'input' or 'processed/Others/HAYK'" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write a file. Only allowed inside processed/ and output/ directories.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path from delivery-system root" },
        content: { type: "string", description: "File content" },
      },
      required: ["path", "content"],
    },
  },
];

function executeTool(name: string, input: Record<string, string>): string {
  try {
    if (name === "read_file") {
      const abs = safePath(input.path);
      if (!abs) return "Error: path traversal not allowed";
      if (!existsSync(abs)) return `Error: not found — ${input.path}`;
      const content = readFileSync(abs, "utf-8");
      return content.length > 80_000 ? content.slice(0, 80_000) + "\n\n[truncated]" : content;
    }

    if (name === "list_dir") {
      const abs = safePath(input.path);
      if (!abs) return "Error: path traversal not allowed";
      if (!existsSync(abs)) return `Error: not found — ${input.path}`;
      const entries = readdirSync(abs, { withFileTypes: true });
      return entries
        .map((e) => `${e.isDirectory() ? "DIR " : "FILE"} ${e.name}`)
        .join("\n") || "(empty)";
    }

    if (name === "write_file") {
      const abs = safePath(input.path);
      if (!abs) return "Error: path traversal not allowed";
      const rel = path.relative(DELIVERY_ROOT, abs);
      if (!rel.startsWith("processed") && !rel.startsWith("output")) {
        return "Error: can only write to processed/ or output/ directories";
      }
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, input.content, "utf-8");
      return `Written: ${input.path}`;
    }
  } catch (e: unknown) {
    return `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
  return "Error: unknown tool";
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split("T")[0];
  return `Bạn là AI assistant của hệ thống Delivery Management. Hôm nay: ${today}.

## Cấu trúc thư mục
- input/[Domain]/[CODE]/ — sprint data đầu vào của team (project-tracking.md, timelog.md, transcript-*.vtt)
- processed/[Domain]/[CODE]/ — data đã xử lý (collected-DATE.md, metrics-DATE.md, insights-DATE.md)
- output/reports/[Domain]/[CODE]/ — sprint reports
- output/alerts/[Domain]/[CODE]/ — risk alerts

## Domains
CA=CardApply, eNV=e-NAVI, Corp=Corporate, Others=Other projects, Mail=Mail projects

## Tools
- read_file(path): đọc file
- list_dir(path): liệt kê files trong thư mục
- write_file(path, content): ghi file (chỉ vào processed/ hoặc output/)

## Quy trình báo cáo sprint
1. list_dir("input") để xem projects có sẵn
2. Với mỗi project: list_dir rồi read_file từng file input
3. Phân tích: tiến độ task, rủi ro, blockers, utilization
4. Tính metrics: completion rate, velocity, budget burn rate
5. Sinh insights: điểm tốt, rủi ro ẩn, hành động đề xuất
6. write_file báo cáo → output/reports/[Domain]/[CODE]/${today}-sprint-report.md
7. Nếu có rủi ro cao → write_file alert → output/alerts/[Domain]/[CODE]/${today}-alert.md
8. Tổng kết cho user

## Quy trình tổng hợp meeting (user attach transcript)
1. Đọc nội dung transcript từ attachment của user
2. Bóc tách: decisions, action items, risks, blockers
3. write_file meeting minute → output/meetings/[Domain]/[CODE]/${today}-meeting.md
4. Cập nhật collected data nếu cần → processed/[Domain]/[CODE]/collected-${today}.md

## Format báo cáo mẫu
\`\`\`markdown
# Sprint Report — [PROJECT] — ${today}
## Tình hình tổng thể
[1-2 câu tóm tắt]
## Metrics
- Completion: X/Y tasks (Z%)
- Overdue: N tasks
- Budget: $Xk/$Yk (Z%)
## Rủi ro & Blockers
[danh sách]
## Hành động đề xuất
[danh sách]
\`\`\`

Trả lời bằng tiếng Việt. Khi thực hiện pipeline, thông báo từng bước ngắn gọn trước khi dùng tool.`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const { messages }: { messages: ClientMessage[] } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not set. Add it to dashboard/.env.local" },
      { status: 500 },
    );
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let currentMessages: Anthropic.MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        // ── Agentic loop ──────────────────────────────────────────────────────
        for (let iteration = 0; iteration < 20; iteration++) {
          const apiStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 8096,
            system: buildSystemPrompt(),
            messages: currentMessages,
            tools: TOOLS,
          });

          const assistantContent: Anthropic.ContentBlock[] = [];
          let currentBlock: (Anthropic.TextBlock | Anthropic.ToolUseBlock) | null = null;
          let toolInputBuf = "";

          for await (const event of apiStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                currentBlock = { type: "text", text: "" };
              } else if (event.content_block.type === "tool_use") {
                currentBlock = {
                  type: "tool_use",
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {},
                };
                toolInputBuf = "";
                send({ type: "tool_start", name: event.content_block.name });
              }
            }

            if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta" && currentBlock?.type === "text") {
                currentBlock.text += event.delta.text;
                send({ type: "text", delta: event.delta.text });
              }
              if (event.delta.type === "input_json_delta") {
                toolInputBuf += event.delta.partial_json;
              }
            }

            if (event.type === "content_block_stop" && currentBlock) {
              if (currentBlock.type === "tool_use") {
                try {
                  (currentBlock as Anthropic.ToolUseBlock).input = JSON.parse(toolInputBuf || "{}");
                } catch { /* malformed json — keep empty input */ }
              }
              assistantContent.push({ ...currentBlock } as Anthropic.ContentBlock);
              currentBlock = null;
            }
          }

          const finalMsg = await apiStream.finalMessage();
          const toolUses = assistantContent.filter((b) => b.type === "tool_use") as Anthropic.ToolUseBlock[];

          if (finalMsg.stop_reason === "end_turn" || toolUses.length === 0) break;

          // Execute tools
          const toolResults: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
            const result = executeTool(tu.name, tu.input as Record<string, string>);
            send({ type: "tool_done", name: tu.name, ok: !result.startsWith("Error") });
            return { type: "tool_result" as const, tool_use_id: tu.id, content: result };
          });

          currentMessages = [
            ...currentMessages,
            { role: "assistant" as const, content: assistantContent },
            { role: "user" as const, content: toolResults },
          ];
        }
      } catch (e: unknown) {
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
