import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowRotateLeft,
  FaCheck,
  FaRegCopy,
  FaRegEye,
  FaRegEyeSlash,
} from 'react-icons/fa6';
import { Container } from '../container';

import { useCopy } from '@/hooks/use-copy';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  getSecureRandomInt,
  getSecureRandomIntInRange,
} from '@/helpers/crypto';
import { capitalizeString } from '@/helpers/string';

import { wordlist } from '@/data/wordlist';

import styles from './app.module.css';
import { cn } from '@/helpers/styles';
import { formatSeconds } from '@/helpers/time';
import { useCrackTime } from '@/hooks/useCrackTime.ts';

const WORDLIST = wordlist;

export function App() {
  const [activeTab, setActiveTab] = useLocalStorage<
    'normal' | 'diceware' | 'pin'
  >('pswd-active-tab', 'normal');
  const { copy, copying } = useCopy();
  const [showPassword, setShowPassword] = useLocalStorage(
    'pswd-show-password',
    true,
  );
  const [password, setPassword] = useState('');
  const [length, setLength] = useLocalStorage('pswd-length', 12);
  const [includeUpper, setIncludeUpper] = useLocalStorage(
    'pswd-include-upper',
    true,
  );
  const [includeLower, setIncludeLower] = useLocalStorage(
    'pswd-include-lower',
    true,
  );
  const [includeNumbers, setIncludeNumbers] = useLocalStorage(
    'pswd-include-numbers',
    true,
  );
  const [includeSymbols, setIncludeSymbols] = useLocalStorage(
    'pswd-include-symbols',
    true,
  );
  const [excludeSimilar, setExcludeSimilar] = useLocalStorage(
    'pswd-exclude-similar',
    false,
  );
  const [customSymbols, setCustomSymbols] = useLocalStorage(
    'pswd-custom-symbols',
    '',
  );
  const [excludeSymbols, setExcludeSymbols] = useLocalStorage(
    'pswd-exclude-symbols',
    '',
  );

  const [base64, setBase64] = useLocalStorage('pswd-base64', false);

  const [wordCount, setWordCount] = useLocalStorage('pswd-word-count', 6);
  const [separator, setSeparator] = useLocalStorage('pswd-separator', 'space');
  const [capitalize, setCapitalize] = useLocalStorage('pswd-capitalize', false);
  const [randomCapitalization, setRandomCapitalization] = useLocalStorage(
    'pswd-random-capitalization',
    false,
  );
  const [randomNumberBeginning, setRandomNumberBeginning] = useLocalStorage(
    'pswd-random-number-beginning',
    false,
  );
  const [randomNumberEnd, setRandomNumberEnd] = useLocalStorage(
    'pswd-random-number-end',
    false,
  );
  const [customWordlist, setCustomWordlist] = useLocalStorage(
    'pswd-custom-wordlist',
    '',
  );

  const [pinLength, setPinLength] = useLocalStorage('pswd-pin-length', 6);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const length = Number(urlParams.get('length'));
    const words = Number(urlParams.get('words'));

    if (length > 0) {
      setLength(length);
      setActiveTab('normal');
    } else if (words > 0) {
      setWordCount(words);
      setActiveTab('diceware');
    }
  }, [setLength, setActiveTab, setWordCount]);

  const wordlist = useMemo(() => {
    const custom = customWordlist
      .split('\n')
      .map(item => item.trim())
      .filter(item => !!item);

    if (custom.length > 0) return custom;
    return WORDLIST;
  }, [customWordlist]);

  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const SIMILAR_CHARACTERS = 'Il1O0';

  const generatePassword = useCallback(() => {
    if (activeTab === 'normal') {
      let characterSet = '';

      if (includeUpper) characterSet += UPPERCASE;
      if (includeLower) characterSet += LOWERCASE;
      if (includeNumbers) characterSet += NUMBERS;
      if (includeSymbols) characterSet += SYMBOLS;

      if (customSymbols) {
        characterSet += customSymbols;
      }

      let toExclude = '';

      if (excludeSimilar) {
        toExclude += SIMILAR_CHARACTERS;
      }

      if (excludeSymbols) {
        toExclude += excludeSymbols;
      }

      if (toExclude) {
        const regex = new RegExp(`[${toExclude}]`, 'g');

        characterSet = characterSet.replace(regex, '');
      }

      if (characterSet.length === 0) {
        setPassword('');
        return;
      }

      const passwordCharacters = [];
      const charsetLength = characterSet.length;

      for (let i = 0; i < length; i++) {
        const randomIndex = getSecureRandomInt(charsetLength);
        passwordCharacters.push(characterSet[randomIndex]);
      }

      const newPassword = passwordCharacters.join('');
      if (base64) {
        setPassword(btoa(newPassword));
      } else {
        setPassword(newPassword);
      }
    } else if (activeTab === 'diceware') {
      if (wordlist.length === 0) {
        alert('Wordlist is empty. Please provide a valid wordlist.');
        return;
      }

      let words: Array<string | number | undefined> = [];
      const wordlistLength = wordlist.length;

      for (let i = 0; i < wordCount; i++) {
        const index = getSecureRandomInt(wordlistLength);
        const word = wordlist[index];

        words.push(capitalize ? capitalizeString(word) : word);
      }

      if (randomCapitalization) {
        words = words.map(word => {
          return String(word)
            .split('')
            .map(letter =>
              Math.random() > 0.5 ? letter.toLowerCase() : letter.toUpperCase(),
            )
            .join('');
        });
      }

      if (randomNumberBeginning) {
        const randomNumber = getSecureRandomIntInRange(100, 999);

        words.unshift(randomNumber);
      }

      if (randomNumberEnd) {
        const randomNumber = getSecureRandomIntInRange(100, 999);

        words.push(randomNumber);
      }

      if (separator === 'symbol') {
        const last = words.pop();

        words = words.map(word => {
          const randomSymbol = SYMBOLS[getSecureRandomInt(SYMBOLS.length)];

          return word + randomSymbol;
        });

        words.push(last);

        setPassword(words.filter(Boolean).join(''));
      } else {
        setPassword(
          words.join(
            separator === 'space' ? ' ' : separator === 'dash' ? '-' : '',
          ),
        );
      }
    } else if (activeTab === 'pin') {
      const passwordCharacters = [];
      const charsetLength = NUMBERS.length;

      for (let i = 0; i < pinLength; i++) {
        const randomIndex = getSecureRandomInt(charsetLength);
        passwordCharacters.push(NUMBERS[randomIndex]);
      }

      const newPassword = passwordCharacters.join('');
      setPassword(newPassword);
    }
  }, [
    pinLength,
    includeUpper,
    randomCapitalization,
    randomNumberBeginning,
    randomNumberEnd,
    includeLower,
    includeNumbers,
    includeSymbols,
    length,
    wordCount,
    activeTab,
    separator,
    excludeSimilar,
    customSymbols,
    capitalize,
    excludeSymbols,
    wordlist,
    base64,
  ]);

  useEffect(() => {
    generatePassword();
  }, [activeTab, generatePassword]);

  const {
    crackTime: calculatedCrackTime,
    loading: calculatingCrackTimeLoading,
  } = useCrackTime(password);
  let strength = 0;
  let crackTime = '';

  if (calculatedCrackTime && !calculatingCrackTimeLoading) {
    crackTime = formatSeconds(
      calculatedCrackTime.crack_times_seconds
        .offline_fast_hashing_1e10_per_second as number,
    );

    strength = calculatedCrackTime.score + 1;
  } else {
    crackTime = '...Loading';
    strength = 0;
  }
  const strenthColor = [
    'transparent',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#65a30d',
    '#22c55e',
  ][strength];
  return (
    <Container wide={true}>
      <div className={styles.generator}>
        <div className={styles.tabs}>
          <button
            className={cn(activeTab === 'normal' && styles.active)}
            onClick={() => setActiveTab('normal')}
          >
            Password
          </button>
          <button
            className={cn(activeTab === 'diceware' && styles.active)}
            onClick={() => setActiveTab('diceware')}
          >
            Passphrase
          </button>
          <button
            className={cn(activeTab === 'pin' && styles.active)}
            onClick={() => setActiveTab('pin')}
          >
            Pin
          </button>
        </div>

        <div className={styles.resultWrapper}>
          <div className={styles.score}>
            <div
              className={styles.filled}
              style={{
                background: strenthColor,
                height: `${(strength / 5) * 100}%`,
              }}
            />
          </div>

          <div className={styles.result}>
            <input
              readOnly
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              className={styles.hide}
              onClick={() => setShowPassword(prev => !prev)}
            >
              {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
            </button>
            <button className={styles.copy} onClick={() => copy(password)}>
              {copying ? <FaCheck /> : <FaRegCopy />}
            </button>
            <button
              className={styles.generate}
              onClick={() => generatePassword()}
            >
              <FaArrowRotateLeft />
            </button>
          </div>
        </div>

        {crackTime && (
          <div className={styles.crackTime}>
            <p className={styles.time}>
              <span className={styles.label}>Crack Time:</span>
              <span className={styles.truncate}>
                <span className={styles.mono}>{crackTime}</span>
              </span>
            </p>

            <p className={styles.attempts}>
              <span className={styles.mono}>
                <span className={styles.accent}>*</span> 10<sup>10</sup>
              </span>{' '}
              <span className={styles.text}>
                hash attempts <span>/ second</span>
              </span>
            </p>
          </div>
        )}

        {activeTab === 'normal' && (
          <div className={styles.tabContent}>
            <div className={styles.controls}>
              <div className={styles.length}>
                <label htmlFor="length">Password Length:</label>
                <div className={styles.inputs}>
                  <input
                    id="length"
                    max="128"
                    min="3"
                    type="number"
                    value={length}
                    onChange={e => setLength(Number(e.target.value))}
                  />

                  <input
                    max="128"
                    min="3"
                    type="range"
                    value={length}
                    onChange={e => setLength(Number(e.target.value))}
                  />
                </div>
              </div>

              <label className={styles.checkbox}>
                <input
                  checked={includeUpper}
                  type="checkbox"
                  onChange={e => setIncludeUpper(e.target.checked)}
                />
                Include Uppercase Letters
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={includeLower}
                  type="checkbox"
                  onChange={e => setIncludeLower(e.target.checked)}
                />
                Include Lowercase Letters
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={includeNumbers}
                  type="checkbox"
                  onChange={e => setIncludeNumbers(e.target.checked)}
                />
                Include Numbers
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={includeSymbols}
                  type="checkbox"
                  onChange={e => setIncludeSymbols(e.target.checked)}
                />
                Include Symbols
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={excludeSimilar}
                  type="checkbox"
                  onChange={e => setExcludeSimilar(e.target.checked)}
                />
                Exclude Similar Characters (e.g., l, 1, O, 0)
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={base64}
                  type="checkbox"
                  onChange={e => setBase64(e.target.checked)}
                />
                Base64 encode
              </label>

              <div className={styles.custom}>
                <label htmlFor="customSymbols">Custom Symbols:</label>
                <input
                  id="customSymbols"
                  placeholder="e.g., @#$%"
                  type="text"
                  value={customSymbols}
                  onChange={e => setCustomSymbols(e.target.value)}
                />
              </div>

              <div className={styles.custom}>
                <label htmlFor="excludeSymbols">Exclude Symbols:</label>
                <input
                  id="excludeSymbols"
                  placeholder="e.g., /\?"
                  type="text"
                  value={excludeSymbols}
                  onChange={e => setExcludeSymbols(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diceware' && (
          <div className={styles.tabContent}>
            <div className={styles.controls}>
              <div className={styles.length}>
                <label htmlFor="count">Number of Words:</label>

                <div className={styles.inputs}>
                  <input
                    id="count"
                    max="20"
                    min="3"
                    type="number"
                    value={wordCount}
                    onChange={e => setWordCount(Number(e.target.value))}
                  />

                  <input
                    max="20"
                    min="3"
                    type="range"
                    value={wordCount}
                    onChange={e => setWordCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <label className={styles.checkbox}>
                <input
                  checked={capitalize}
                  type="checkbox"
                  onChange={e => setCapitalize(e.target.checked)}
                />
                Capitalize Words
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={randomCapitalization}
                  type="checkbox"
                  onChange={e => setRandomCapitalization(e.target.checked)}
                />
                Randomly Capitalize Letters
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={randomNumberBeginning}
                  type="checkbox"
                  onChange={e => setRandomNumberBeginning(e.target.checked)}
                />
                Add Random Numbers At The Beginning
              </label>

              <label className={styles.checkbox}>
                <input
                  checked={randomNumberEnd}
                  type="checkbox"
                  onChange={e => setRandomNumberEnd(e.target.checked)}
                />
                Add Random Numbers At The End
              </label>

              <div className={styles.separator}>
                <label htmlFor="separator">Word Separator:</label>
                <select
                  value={separator}
                  onChange={e => setSeparator(e.target.value)}
                >
                  <option value="space">Space</option>
                  <option value="symbol">Random Symbol</option>
                  <option value="dash">Dash</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div className={styles.customWordlist}>
                <label htmlFor="wordlist">
                  Custom Wordlist <span>(separate with breaklines)</span>:
                </label>
                <textarea
                  id="wordlist"
                  value={customWordlist}
                  onChange={e => setCustomWordlist(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pin' && (
          <div className={styles.tabContent}>
            <div className={styles.controls}>
              <div className={styles.length}>
                <label htmlFor="length">Pin Length:</label>

                <div className={styles.inputs}>
                  <input
                    id="count"
                    max="20"
                    min="3"
                    type="number"
                    value={pinLength}
                    onChange={e => setPinLength(Number(e.target.value))}
                  />

                  <input
                    max="20"
                    min="3"
                    type="range"
                    value={pinLength}
                    onChange={e => setPinLength(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className={styles.donate}>
        Support me with a <a href="https://buymeacoffee.com/remvze">donation</a>
        .
      </p>
    </Container>
  );
}
