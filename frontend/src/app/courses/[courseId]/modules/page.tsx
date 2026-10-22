import { ModulesPanel } from "../../../../components/content/modules-panel.tsx";
export default async function ModulesPage({params}:{params:Promise<{courseId:string}>}) {
  const {courseId}=await params;return <ModulesPanel courseId={courseId}/>;
}
