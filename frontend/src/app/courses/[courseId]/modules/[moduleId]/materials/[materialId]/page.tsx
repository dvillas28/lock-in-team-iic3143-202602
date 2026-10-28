import { MaterialReader } from "../../../../../../../components/content/material-reader.tsx";
export default async function MaterialPage({params}:{params:Promise<{courseId:string;moduleId:string;materialId:string}>}) {
  return <MaterialReader {...await params}/>;
}
