import assert from "node:assert/strict";
import { test } from "node:test";
import { assignmentState, chileCandidates, chileFormWall, chileInstant, chileOffset, dateBucket, displayChile, validateDueAt, validateSchedule } from "../src/lib/assignments/dates.ts";

test("Santiago wall times handle the missing and repeated daylight-saving hour",()=>{
  assert.deepEqual(chileCandidates("2026-09-06T00:30"),[]);
  const repeated=chileCandidates("2026-04-04T23:30");
  assert.deepEqual(repeated,["2026-04-05T02:30:00.000Z","2026-04-05T03:30:00.000Z"]);
  assert.throws(()=>chileInstant("2026-04-04T23:30","dueAt"),/dos horas/);
  assert.equal(chileInstant("2026-04-04T23:30","dueAt",null,repeated[1]),repeated[1]);
  assert.equal(chileInstant("2026-04-04T23:30","dueAt","2026-04-05T03:30:00.123456Z",repeated[1]),"2026-04-05T03:30:00.123456Z");
  assert.deepEqual(chileCandidates("2026-02-30T12:00"),[]);
});

test("opening, deadline and closing have distinct inclusive boundaries",()=>{
  const value={availableFrom:"2026-11-01T14:00:00.000Z",dueAt:"2026-11-02T14:00:00.000Z",availableUntil:"2026-11-03T14:00:00.000Z"};
  assert.equal(assignmentState(value,Date.parse(value.availableFrom)-1),"upcoming");
  assert.equal(assignmentState(value,Date.parse(value.availableFrom)),"open");
  assert.equal(assignmentState(value,Date.parse(value.dueAt)),"open");
  assert.equal(assignmentState(value,Date.parse(value.dueAt)+1),"late");
  assert.equal(dateBucket(value,Date.parse(value.availableUntil)),"late");
  assert.equal(dateBucket(value,Date.parse(value.availableUntil)+1),"past");
  assert.equal(assignmentState({...value,availableUntil:null},Date.parse(value.dueAt)+1),"closed");
  assert.equal(dateBucket({availableFrom:null,dueAt:null,availableUntil:null},Date.now()),"undated");
  assert.throws(()=>validateSchedule({availableFrom:"2026-11-01T14:00:00.000002Z",dueAt:null,availableUntil:"2026-11-01T14:00:00.000001Z"}));
});

test("schedule validation reports the affected field and allows optional or equal dates",()=>{
  assert.throws(
    () => validateSchedule({availableFrom:"2026-11-10T12:00:00.000000Z",dueAt:"2026-11-15T12:00:00.000000Z",availableUntil:"2026-11-12T12:00:00.000000Z"}),
    error => error instanceof Error && error.message.includes("cierre") && (error as {field?:string}).field === "availableUntil",
  );
  assert.throws(
    () => validateSchedule({availableFrom:"2026-11-16T12:00:00.000000Z",dueAt:"2026-11-15T12:00:00.000000Z",availableUntil:null}),
    error => error instanceof Error && error.message.includes("apertura") && (error as {field?:string}).field === "availableFrom",
  );
  assert.doesNotThrow(() => validateSchedule({
    availableFrom:null,dueAt:"2026-11-15T12:00:00.000000Z",availableUntil:"2026-11-15T12:00:00.000000Z",
  }));
  assert.doesNotThrow(() => validateSchedule({availableFrom:null,dueAt:null,availableUntil:null}));
});

test("new or changed deadlines strictly before now are rejected",()=>{
  const dueAt="2026-11-02T14:00:00.000000Z";
  const now=Date.parse(dueAt);
  assert.doesNotThrow(() => validateDueAt(dueAt,null,now));
  assert.throws(() => validateDueAt(dueAt,null,now+1),/no puede ser anterior/);
  assert.doesNotThrow(() => validateDueAt(dueAt,dueAt,now+1));
  assert.throws(() => validateDueAt("2026-11-02T13:59:59.999999Z",dueAt,now),/no puede ser anterior/);
  assert.doesNotThrow(() => validateDueAt(null,dueAt,now+1));
});

test("Chilean form dates and 24-hour display preserve the intended instants",()=>{
  const wall=chileFormWall("04-04-2026","23:30","dueAt");
  const [first,second]=chileCandidates(wall);
  assert.equal(chileOffset(first),"UTC−3");
  assert.equal(chileOffset(second),"UTC−4");
  assert.equal(displayChile(first,true),"04-04-2026, 23:30 (UTC−3)");
  assert.equal(displayChile(second,true),"04-04-2026, 23:30 (UTC−4)");
  assert.equal(chileInstant(wall,"dueAt",null,first),"2026-04-05T02:30:00.000Z");
  assert.equal(chileInstant(wall,"dueAt",null,second),"2026-04-05T03:30:00.000Z");
  const original="2026-04-05T03:30:42.123456Z";
  const unchanged=chileFormWall("04-04-2026","23:30","dueAt",original);
  assert.equal(chileInstant(unchanged,"dueAt",original,chileCandidates(unchanged)[1]),original);
  assert.equal(displayChile("2026-04-05T04:00:00Z"),"05-04-2026, 00:00");
  assert.equal(chileFormWall("","","dueAt"),"");
  assert.throws(()=>chileFormWall("04-04-2026","","dueAt"),/24 horas/);
  assert.throws(()=>chileFormWall("04-04-2026","24:00","dueAt"),/24 horas/);
  assert.throws(()=>chileFormWall("04/04/2026","23:30","dueAt"),/dd-MM-aaaa/);
  const gap=chileFormWall("06-09-2026","00:30","dueAt");
  assert.throws(()=>chileInstant(gap,"dueAt"),/no existe en Santiago/);
});
