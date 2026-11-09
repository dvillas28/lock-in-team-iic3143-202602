'use client';
import Image from 'next/image';
import { useEffect,useState } from 'react';
import { avatar } from '../../lib/api/accounts.ts';
import { useSession } from '../auth/session-provider.tsx';
export function AccountAvatar({name,large=false}:{name:string;large?:boolean}) {
 const {session,state}=useSession();const account=state.account;
 const [image,setImage]=useState<{key:string;url:string}>();
 const key=`${state.generation}:${account?.id}:${account?.updatedAt}`;
 useEffect(()=>{
  if(!account?.hasAvatar||!account.capabilities.avatar)return;
  let alive=true,url:string|undefined;
  void session.accountRequest(avatar).then(blob=>{if(!alive)return;url=URL.createObjectURL(blob);setImage({key,url});}).catch(()=>{});
  return()=>{alive=false;if(url)URL.revokeObjectURL(url);};
 },[session,account?.hasAvatar,account?.capabilities.avatar,key]);
 return <span className={`avatar${large?' account-avatar-large':''}`} aria-hidden="true">{image?.key===key?<Image src={image.url} alt="" width={large?96:32} height={large?96:32} unoptimized/>:name.trim().slice(0,1).toUpperCase()}</span>;
}
