import { createContext, useContext } from "react";
import type { LanguageCode } from "../language";
import type { Translations } from "./types";

import km from "./km";
import en from "./en";
import th from "./th";
import vi from "./vi";
import my from "./my";
import lo from "./lo";
import hi from "./hi";
import ar from "./ar";
import ur from "./ur";
import ta from "./ta"; // Tamil
import tr from "./tr"; // Turkish
import fa from "./fa"; // Persian
import fr from "./fr";
import es from "./es";
import pt from "./pt";
import zh from "./zh";
import ru from "./ru";
import ja from "./ja";
import ko from "./ko";
import de from "./de";
import it from "./it";
import nl from "./nl";
import pl from "./pl";
import uk from "./uk";
import sv from "./sv";
import el from "./el";
import he from "./he";
import ro from "./ro";
import cs from "./cs";
import hu from "./hu";
import id from "./id";
import ms from "./ms";
import tl from "./tl";
import bn from "./bn";
import ne from "./ne";
import si from "./si";
import mn from "./mn";

export const DICTIONARIES: Partial<Record<LanguageCode, Translations>> = {
  km, en, th, vi, my, lo, hi, ar, ur, ta, tr, fa,
  fr, es, pt, zh, ru,
  ja, ko, de, it, nl, pl, uk, sv, el, he, ro, cs, hu, id, ms, tl, bn, ne, si, mn,
};

export function getTranslations(code: LanguageCode): Translations {
  return DICTIONARIES[code] ?? km;
}

export function pickText(code: LanguageCode, km: string, en: string): string {
  return code === "km" ? km : en;
}

const LanguageContext = createContext<LanguageCode>("km");
export const LanguageProvider = LanguageContext.Provider;

export function useT(): Translations {
  const code = useContext(LanguageContext);
  return getTranslations(code);
}

export function useLanguageCode(): LanguageCode {
  return useContext(LanguageContext);
}
