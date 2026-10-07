import "server-only";
import data from "@/data/drills/market-sizing.json";
import type { MarketSizing } from "@/lib/training-types";

const ALL = data as MarketSizing[];
export const listSizing = () => ALL;
export const getSizing = (id: string) => ALL.find((p) => p.id === id);
