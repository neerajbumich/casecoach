import json,sys
ok=True
T={"text","list","table","callout","compare"}
for f in sys.argv[1:]:
    e=[]
    try: d=json.load(open(f))
    except Exception as x: print("FAIL",f,x); ok=False; continue
    for k in ["id","section","order","title","summary","blocks","in_a_case","flashcards","sources","checked"]:
        if k not in d: e.append("missing "+k)
    if not e:
        if d["section"] not in ("consumer","business","culture"): e.append("section")
        if not 4<=len(d["blocks"])<=12: e.append("blocks 5-10")
        for b in d["blocks"]:
            t=b.get("type")
            if t not in T: e.append(f"bad block type {t}"); continue
            if t=="text" and not b.get("body"): e.append("text.body")
            if t=="list" and not (b.get("title") and b.get("items")): e.append("list")
            if t=="table" and not (b.get("columns") and b.get("rows") and all(len(r)==len(b["columns"]) for r in b["rows"])): e.append("table shape")
            if t=="callout" and b.get("tone") not in ("tip","watch"): e.append("callout tone")
            if t=="compare" and not (b.get("rows") and all(len(r)==3 for r in b["rows"])): e.append("compare rows need 3 cells")
        if not 3<=len(d["in_a_case"])<=6: e.append("in_a_case 3-5")
        if not 5<=len(d["flashcards"])<=14 or not all(c.get("front") and c.get("back") for c in d["flashcards"]): e.append("flashcards 6-12")
        if f.split("/")[-1]!=d["id"]+".json": e.append("filename")
    print("OK  " if not e else "FAIL",f,"; ".join(e)); ok=ok and not e
sys.exit(0 if ok else 1)
