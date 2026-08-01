"""Snippet to wire into propmodel/__main__.py (bet-model / Modeling).

1) Near other imports from propmodel.*:

    from propmodel.pinnacle_check import print_pinnacle_check, run_pinnacle_check

2) After the resolve-sheets parser (or near other scan parsers):

    p_pin = sub.add_parser(
        "pinnacle-check",
        help="Re-scrape Pinnacle fair for prior scan rows missing fair_value_source=pinnacle",
    )
    p_pin.add_argument("league", choices=["wnba"], help="Only wnba is supported")
    p_pin.add_argument(
        "--date",
        default="today",
        help='"today", "tomorrow", or YYYY-MM-DD (Eastern)',
    )
    p_pin.add_argument("--json", action="store_true")

3) In the command dispatch (elif chain):

    elif args.command == "pinnacle-check":
        result = run_pinnacle_check(args.league, args.date)
        if args.json:
            print(json.dumps(result, indent=2, default=str))
        else:
            print_pinnacle_check(result)
        return
"""
