import json,sys
d=json.load(open("/home/claude/cc/data/drills/market-sizing.json"))
ok=True; ids=set(); diff={1:0,2:0,3:0}
for p in d:
    e=[]
    for k in ["id","question","difficulty","unit","tags","clarify","approach","assumptions","calc","estimate","estimate_value","range","sanity_check","so_what"]:
        if k not in p: e.append("missing "+k)
    if not e:
        if p["id"] in ids: e.append("dup id")
        ids.add(p["id"]); diff[p["difficulty"]]=diff.get(p["difficulty"],0)+1
        lo,hi=p["range"]
        if not (isinstance(p["estimate_value"],(int,float)) and lo<=p["estimate_value"]<=hi): e.append("estimate_value outside range")
        if not (lo>0 and hi/lo<=6): e.append("range too wide or invalid")
        if not all(isinstance(a,dict) and a.get("label") and a.get("value") for a in p["assumptions"]): e.append("assumptions shape")
    if e: ok=False; print("FAIL",p.get("id"),"; ".join(e))
print(len(d),"problems; difficulty mix",diff)
sys.exit(0 if ok and len(d)>=25 else 1)
