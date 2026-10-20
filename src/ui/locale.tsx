import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";
import { italian, italianTemplates } from "./italian";
import { readPreference, writePreference } from "./preferences";
export type Language = "en" | "it";
const LANGUAGE_KEY = "check-happens-language";
const LocaleContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: "en", setLanguage: () => {} });
const templates = italianTemplates.map(([source, target]) => {
  const names: string[] = [];
  const pattern = source
    .split(/(\{\w+\})/)
    .map((part) => {
      if (part.startsWith("{")) {
        names.push(part.slice(1, -1));
        return ["n", "selected", "remaining", "bonus", "required"].includes(
          part.slice(1, -1),
        )
          ? "(\\d+)"
          : part === "{square}"
            ? "([a-h][1-8])"
            : "(.+?)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return { pattern: new RegExp(`^${pattern}$`), names, target };
});
/** Translate presentation text only, never match state or machine-readable values. */
export function translate(text: string, language: Language, depth = 0): string {
  if (language === "en" || depth > 5) return text;
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return text;
  let result = italian[clean];
  if (!result) {
    for (const { pattern, names, target } of templates) {
      const match = pattern.exec(clean);
      if (match) {
        result = target.replace(/\{(\w+)\}/g, (_, name: string) =>
          translate(match[names.indexOf(name) + 1], language, depth + 1),
        );
        break;
      }
    }
  }
  // JSX may join phrases with punctuation or render dynamic values separately.
  if (!result && / · |: | → |, /.test(clean)) {
    result = clean
      .split(/( · |: | → |, )/)
      .map((part) => translate(part, language, depth + 1))
      .join("");
  }
  if (!result && clean.endsWith(":"))
    result = translate(clean.slice(0, -1), language, depth + 1) + ":";
  if (!result) return text;
  return (
    text.slice(0, text.indexOf(text.trimStart())) +
    result +
    text.slice(text.trimEnd().length)
  );
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrent] = useState<Language>(() =>
    readPreference<string>(LANGUAGE_KEY, "en") === "it" ? "it" : "en",
  );
  const setLanguage = (next: Language) => {
    setCurrent(next);
    writePreference(LANGUAGE_KEY, next);
  };
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <LocaleContext.Provider value={{ language, setLanguage }}>
      {children}
    </LocaleContext.Provider>
  );
}
export const useLanguage = () => useContext(LocaleContext);
/** A React presentation boundary: translates text and accessible labels, leaving
 * handlers, IDs, input values, CSS classes and diagnostic records untouched.
 * Child components own their boundary; no DOM mutation or third-party service. */
export function Localized({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  if (language === "en") return <>{children}</>;
  const visit = (node: ReactNode): ReactNode => {
    if (typeof node === "string") return translate(node, language);
    if (!isValidElement(node)) return node;
    const element = node as ReactElement<Record<string, unknown>>;
    if (element.props.translate === "no") return element;
    const props: Record<string, unknown> = {};
    for (const key of ["aria-label", "title", "placeholder", "alt"]) {
      const value = element.props[key];
      if (typeof value === "string") props[key] = translate(value, language);
    }
    if (element.props.children !== undefined)
      props.children = Children.map(element.props.children as ReactNode, visit);
    return cloneElement(element, props);
  };
  return <>{Children.map(children, visit)}</>;
}
