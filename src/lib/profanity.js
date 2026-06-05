const leetMap = {
  "0": "o", "1": "i", "2": "z", "3": "e", "4": "a", "5": "s", "6": "g",
  "7": "t", "8": "b", "9": "g",
  "@": "a", "$": "s", "!": "i", "%": "x", "#": "h",
  "(": "c", ")": "c", "<": "c", ">": "c",
  "*": "a", "+": "t", "=": "e",
}

const homoglyphMap = {
  "à": "a", "á": "a", "â": "a", "ã": "a", "ä": "a", "å": "a", "æ": "a",
  "è": "e", "é": "e", "ê": "e", "ë": "e",
  "ì": "i", "í": "i", "î": "i", "ï": "i",
  "ò": "o", "ó": "o", "ô": "o", "õ": "o", "ö": "o", "ø": "o",
  "ù": "u", "ú": "u", "û": "u", "ü": "u",
  "ý": "y", "ÿ": "y",
  "ñ": "n", "ç": "c",
  "ß": "ss",
}

const words = {
  profanity: [
    "fuck", "shit", "cunt", "bitch", "asshole", "dick", "bastard",
    "motherfucker", "pissed", "cock", "prick", "douche", "twat",
    "wanker", "bollocks", "arsehole", "shithead", "dickhead",
  ],
  slurs: [
    "nigger", "nigga", "faggot", "fag", "kike", "spic", "chink",
    "gook", "wetback", "raghead", "coon", "dyke", "tranny",
    "retard", "mongoloid",
  ],
  sexual: [
    "porn", "blowjob", "handjob", "fellatio", "cunnilingus",
    "penis", "vagina", "clit", "dildo", "vibrator",
    "orgasm", "cum", "semen", "masturbate", "masturbation",
    "prostitute", "whore", "slut", "hooker", "escort",
    "incest", "bestiality", "molest", "pedophile", "pedo",
    "rape", "rapist",
  ],
  drugs: [
    "weed", "cocaine", "crack", "heroin", "meth", "amphetamine",
    "ecstasy", "mdma", "lsd", "mushroom", "shroom",
    "opium", "morphine", "oxycodone", "xanax", "adderall",
    "marijuana", "cannabis", "hash", "inject",
  ],
  insults: [
    "idiot", "imbecile", "moron",
  ],
  violence: [
    "kill", "murder",     "suicide", "selfharm",
    "slaughter", "massacre", "torture", "beheading",
    "terrorist", "terrorism", "bomb", "explosive",
  ],
  harassment: [
    "kys", "kill yourself",
    "die", "worthless",
    "pathetic", "loser", "nobody",
    "bully", "bullying",
  ],
}

const allowedMild = ["damn", "hell", "crap", "ass"]

const allWords = Object.values(words).flat()
const multiWordPhrases = allWords.filter(w => w.includes(" "))
const singleWords = allWords.filter(w => !w.includes(" "))

const normalizeText = (text) => {
  let s = text.toLowerCase()
  for (const [leet, letter] of Object.entries(leetMap)) {
    s = s.split(leet).join(letter)
  }
  for (const [glyph, letter] of Object.entries(homoglyphMap)) {
    s = s.split(glyph).join(letter)
  }
  s = s.replace(/[^a-z\s]/g, "")
  s = s.replace(/(.)\1+/g, "$1")
  return s
}

const normalizedSingleWords = singleWords.map(normalizeText)

function buildPattern(word) {
  return word.split("").map(c => c + "+[^a-z0-9]*?").join("")
}

export function containsProfanity(text) {
  return censorMessage(text) !== text
}

export function censorMessage(text) {
  const separatorsRegex = /[.\-*_@+~:;,#$%^&!=|\\/()[\]]/g

  const normalizedFull = normalizeText(text.replace(separatorsRegex, ""))
  for (const phrase of multiWordPhrases) {
    if (normalizedFull.includes(normalizeText(phrase))) {
      return "*".repeat(text.length)
    }
  }

  const composite = text.replace(/\s+/g, "")
  const strippedComposite = composite.replace(separatorsRegex, "")
  const normalComposite = normalizeText(strippedComposite)
  for (const badWord of normalizedSingleWords) {
    if (normalComposite.includes(badWord)) {
      const re = new RegExp(buildPattern(badWord), "gi")
      const match = re.exec(text.replace(/\s+/g, ""))
      if (match) {
        return "*".repeat(text.length)
      }
    }
  }

  const vowels = ["a", "e", "i", "o", "u"]

  const tokens = text.split(/(\s+)/)

  return tokens.map((token) => {
    if (!token.trim()) return token

    const stripped = token.replace(separatorsRegex, "")
    if (!stripped) return token

    const normal = normalizeText(stripped)
    if (!normal) return token

    for (const badWord of normalizedSingleWords) {
      if (normal.includes(badWord)) {
        return "*".repeat(token.length)
      }
    }

    for (let i = 0; i < singleWords.length; i++) {
      const re = new RegExp(buildPattern(singleWords[i]), "gi")
      if (re.test(token)) {
        return "*".repeat(token.length)
      }
    }

    if (token.includes("*")) {
      const parts = token.toLowerCase().split("*")
      const tryVowels = (i, acc) => {
        if (i >= parts.length) {
          const filled = normalizeText(acc.join(""))
          for (const badWord of normalizedSingleWords) {
            if (filled.includes(badWord)) return true
          }
          return false
        }
        for (let vi = 0; vi < vowels.length; vi++) {
          const next = parts[i] + (i < parts.length - 1 ? vowels[vi] : "")
          if (tryVowels(i + 1, [...acc, next])) return true
        }
        return false
      }
      if (tryVowels(0, [])) return "*".repeat(token.length)
    }

    return token
  }).join("")
}
