"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import {AttemptOperations} from "../../lib/attempts/operations.ts";
import type {Session} from "../../lib/auth/session.ts";
import type {CurrentUser} from "../../lib/auth/validation.ts";
import type {Course} from "../../lib/courses/validation.ts";
import type {SafeQuiz} from "../../lib/quizzes/validation.ts";
import type {Attempt} from "../../lib/attempts/validation.ts";
// Parent keys this owner by session/context/resource, so each document scope has its own keys.
export function useAttemptOperations(session:Session,slug:string,user:CurrentUser,course:Course,quiz:SafeQuiz,initial?:Attempt){
 const [ops]=useState(()=>new AttemptOperations(session,slug,user,course,quiz,initial));
 const state=useSyncExternalStore(ops.subscribe,ops.getSnapshot,ops.getSnapshot);
 useEffect(()=>{ops.activate(initial);return ops.dispose;},[ops,initial]);
 return {ops,state};
}
