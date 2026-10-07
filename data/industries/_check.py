import json, sys
FW = set("profitability market-entry mergers-acquisitions pricing new-product-gtm growth-strategy cost-reduction market-sizing investment-npv breakeven operations-capacity competitive-response turnaround porters-five-forces three-cs supply-demand customer-segmentation value-chain public-sector-social-impact".split())
GROUPS = {"Tech & media","Consumer & retail","Travel & transport","Energy & resources","Financial services","Healthcare","Industrials","Public & services"}
ok = True
for f in sys.argv[1:]:
    errs = []
    try:
        d = json.load(open(f))
    except Exception as e:
        print("FAIL", f, e); ok = False; continue
    for k, t in [("id",str),("name",str),("group",str),("one_liner",str),("how_it_makes_money",str),("value_chain",list),("revenue_formula",list),("cost_structure",list),("margins",str),("key_metrics",list),("trends",list),("key_players",list),("case_angles",list),("interview_hooks",list),("news",dict)]:
        if not isinstance(d.get(k), t): errs.append(f"{k} missing or not {t.__name__}")
    if not errs:
        if d["group"] not in GROUPS: errs.append("bad group")
        if not 4 <= len(d["value_chain"]) <= 7: errs.append("value_chain 4-6")
        if not 5 <= len(d["key_metrics"]) <= 8: errs.append("key_metrics 5-7")
        if any(not isinstance(m, dict) or not m.get("name") or not m.get("what") for m in d["key_metrics"]): errs.append("key_metrics items need name+what")
        if not 3 <= len(d["trends"]) <= 7: errs.append("trends 4-6")
        if not 3 <= len(d["case_angles"]) <= 5: errs.append("case_angles 3-4")
        for a in d["case_angles"]:
            if a.get("framework_id") not in FW: errs.append(f"bad framework_id {a.get('framework_id')}")
        n = d["news"]
        if not (5 <= len(n.get("keywords", [])) <= 14 and 4 <= len(n.get("companies", [])) <= 14): errs.append("news keywords 6-12 / companies 6-12")
        if any(k != k.lower() for k in n.get("keywords", [])): errs.append("keywords must be lowercase")
        if f.split("/")[-1] != d["id"] + ".json": errs.append("filename must be <id>.json")
    print(("OK  " if not errs else "FAIL"), f, "; ".join(errs)); ok = ok and not errs
sys.exit(0 if ok else 1)
