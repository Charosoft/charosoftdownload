import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Erreur dont le message peut être montré tel quel à l'utilisateur. */
export class UrlNotAllowedError extends Error {}

const BLOCKED_HOSTNAMES = ["localhost", "localhost.localdomain"];
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home"];

function ipv4ToNumber(ip: string): number {
  return ip.split(".").reduce((total, part) => total * 256 + Number(part), 0);
}

function inRange(value: number, start: string, end: string): boolean {
  return value >= ipv4ToNumber(start) && value <= ipv4ToNumber(end);
}

/** Adresses IPv4 non publiques (réseau local, loopback, cloud metadata…). */
function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToNumber(ip);

  return (
    inRange(n, "0.0.0.0", "0.255.255.255") ||
    inRange(n, "10.0.0.0", "10.255.255.255") ||
    inRange(n, "100.64.0.0", "100.127.255.255") ||
    inRange(n, "127.0.0.0", "127.255.255.255") ||
    inRange(n, "169.254.0.0", "169.254.255.255") ||
    inRange(n, "172.16.0.0", "172.31.255.255") ||
    inRange(n, "192.0.0.0", "192.0.0.255") ||
    inRange(n, "192.168.0.0", "192.168.255.255") ||
    inRange(n, "198.18.0.0", "198.19.255.255") ||
    inRange(n, "224.0.0.0", "255.255.255.255")
  );
}

function isPrivateIPv6(ip: string): boolean {
  const value = ip.toLowerCase();

  // IPv4 écrit en IPv6, forme « ::ffff:127.0.0.1 » : on vérifie l'IPv4 contenue.
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) return isPrivateIPv4(mapped[1]);

  // Même chose en hexadécimal, forme « ::ffff:7f00:1 » (celle que produit new URL()).
  const hex = value.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);

  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);

    return isPrivateIPv4(
      `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`,
    );
  }

  return (
    value.startsWith("64:ff9b:") ||
    value.startsWith("2002:") ||
    value.startsWith("2001:0:") ||
    value === "::" ||
    value === "::1" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe8") ||
    value.startsWith("fe9") ||
    value.startsWith("fea") ||
    value.startsWith("feb") ||
    value.startsWith("ff")
  );
}

function isPrivateAddress(ip: string): boolean {
  return isIP(ip) === 6 ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

/**
 * Accepte uniquement une URL http(s) qui pointe vers Internet.
 * Refuse localhost, les réseaux privés, les adresses internes du cloud, etc.,
 * pour que le serveur ne puisse pas être utilisé pour atteindre des services
 * internes (attaque « SSRF »).
 *
 * Limite connue : si le site redirige ensuite vers une adresse interne, ou
 * change d'adresse entre cette vérification et le téléchargement, ce contrôle
 * ne peut pas le voir. Pour une protection totale en production, il faut aussi
 * interdire au serveur d'accéder au réseau interne (pare-feu).
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new UrlNotAllowedError("Veuillez fournir une URL valide.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new UrlNotAllowedError("Le lien doit utiliser HTTP ou HTTPS.");
  }

  if (url.username || url.password) {
    throw new UrlNotAllowedError("Ce type de lien n'est pas pris en charge.");
  }

  // new URL() écrit les IPv6 entre crochets : on les retire.
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    BLOCKED_HOSTNAMES.includes(hostname) ||
    BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw new UrlNotAllowedError("Ce lien n'est pas autorisé.");
  }

  const addresses = isIP(hostname)
    ? [hostname]
    : await lookup(hostname, { all: true, verbatim: true })
        .then((results) => results.map((result) => result.address))
        .catch(() => {
          throw new UrlNotAllowedError(
            "Impossible de trouver ce site. Vérifie le lien.",
          );
        });

  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new UrlNotAllowedError("Ce lien n'est pas autorisé.");
  }

  return url;
}
