import {AcademicFileReader} from "../../../../../../../components/content/academic-file-reader.tsx";

export default async function AcademicFilePage({params}:{params:Promise<{courseId:string;moduleId:string;fileId:string}>}) {
 return <AcademicFileReader {...await params}/>;
}
