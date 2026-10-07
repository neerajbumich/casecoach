import json,sys
ok=True
for f in sys.argv[1:]:
    e=[]
    try: d=json.load(open(f))
    except Exception as x: print("FAIL",f,x); ok=False; continue
    for k in ["id","name","tier","one_liner","at_a_glance","interview_process","what_they_look_for","culture","why_us_angles","prep_tips","practice_mode","sources","checked"]:
        if k not in d: e.append("missing "+k)
    if not e:
        if d["tier"] not in ("MBB","Big 4 strategy","Tier 2"): e.append("tier")
        if d["practice_mode"] not in ("mckinsey","bcg","bain","tier2"): e.append("practice_mode")
        ip=d["interview_process"]
        for k in ["rounds","case_style","fit_style","assessments"]:
            if k not in ip: e.append("interview_process."+k)
        for k,lo,hi in [("at_a_glance",3,7),("what_they_look_for",3,7),("culture",2,6),("why_us_angles",3,6),("prep_tips",3,7),("sources",1,6)]:
            if not (isinstance(d[k],list) and lo<=len(d[k])<=hi): e.append(f"{k} count {lo}-{hi}")
        if f.split("/")[-1]!=d["id"]+".json": e.append("filename")
    print("OK  " if not e else "FAIL",f,"; ".join(e)); ok=ok and not e
sys.exit(0 if ok else 1)
