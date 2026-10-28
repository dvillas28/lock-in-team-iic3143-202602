import {ProtectedInstitution} from "../../../components/auth/protected-institution.tsx";
import {AttemptDetail} from "../../../components/attempts/attempt-detail.tsx";
export default async function Page({params}:{params:Promise<{attemptId:string}>}){
 const {attemptId}=await params;
 return <ProtectedInstitution><AttemptDetail attemptId={attemptId}/></ProtectedInstitution>;
}
