import { DeliveryDashboard } from "./DeliveryDashboard";
import { loadRealData } from "./realDataLoader";
import { PROJECTS, RESOURCES } from "./mockData";

export const metadata = {
  title: "Delivery Management Dashboard",
  description: "Track project delivery progress and allocate team resources",
};

export default function V2Page() {
  const real = loadRealData();
  const projects  = real.projects.length  > 0 ? real.projects  : PROJECTS;
  const resources = real.resources.length > 0 ? real.resources : RESOURCES;

  return <DeliveryDashboard initialProjects={projects} initialResources={resources} />;
}
