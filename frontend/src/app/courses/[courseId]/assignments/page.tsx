import { Assignments } from "../../../../components/assignments/assignments.tsx";

export default async function Page({params}:{params:Promise<{courseId:string}>}) {
  return <Assignments {...await params}/>;
}
