#!/usr/bin/env python3
"""Reorder a pg_restore --list file so TABLE DATA follows foreign-key order (parents first).

usage: order_restore_list.py LIST_IN LIST_OUT CONNINFO
CONNINFO is a libpq conninfo for the already migrated target database (read-only queries).
"""
import re
import subprocess
import sys
from graphlib import CycleError, TopologicalSorter

list_in, list_out, conninfo = sys.argv[1:4]
query = """SELECT cl.relname, pl.relname FROM pg_constraint c
 JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_class pl ON pl.oid=c.confrelid
 JOIN pg_namespace n ON n.oid=cl.relnamespace
 WHERE c.contype='f' AND n.nspname='public' AND cl.oid<>pl.oid"""
rows = subprocess.run(["psql", conninfo, "-At", "-F", " ", "-c", query],
                      check=True, capture_output=True, text=True).stdout.splitlines()

lines = open(list_in).read().splitlines()
data = {}
other, seq = [], []
for line in lines:
    m = re.search(r"TABLE DATA public (\S+) ", line)
    if m:
        data[m.group(1)] = line
    elif "SEQUENCE SET" in line:
        seq.append(line)
    else:
        other.append(line)

graph = {table: set() for table in data}
for row in rows:
    child, parent = row.split()
    if child in graph and parent in graph:
        graph[child].add(parent)
try:
    order = list(TopologicalSorter(graph).static_order())
except CycleError as error:
    sys.exit(f"foreign-key cycle, load in two passes: {error.args[1]}")

with open(list_out, "w") as out:
    out.write("\n".join(other + [data[t] for t in order] + seq) + "\n")
print("order:", " -> ".join(order))
