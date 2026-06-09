#!/usr/bin/env node
/*
 * One-shot generator: adds `java` and `cpp` entries to every problem's
 * starterCode + harness in src/data/problems.json.
 *
 * Conventions (must match the existing js/ts/python harnesses byte-for-byte,
 * since testRunner compares stdout after normalize()):
 *   - Java: user writes `class Solution { <method> }`; harness appends a
 *     `public class Main` (file is Main.java) that reads stdin, calls Solution,
 *     and prints. No-space int arrays, lowercase true/false.
 *   - C++: user writes a free function (with <bits/stdc++.h> + using namespace std
 *     in the starter); harness appends int main().
 */
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'data', 'problems.json');
const problems = JSON.parse(fs.readFileSync(file, 'utf8'));

// ---- per-problem spec -------------------------------------------------------
// in:  ints | ints_int | str | str_str | str_int | int | strs
// out: int | bool | str | intarr | strarr
const SPEC = {
  'two-sum':                    { in: 'ints_int', out: 'intarr', fn: 'twoSum',                 jret: 'int[]',    cret: 'vector<int>' },
  'valid-parentheses':          { in: 'str',      out: 'bool',   fn: 'isValid',                jret: 'boolean',  cret: 'bool' },
  'reverse-string':             { in: 'str',      out: 'str',    fn: 'reverseString',          jret: 'String',   cret: 'string' },
  'maximum-subarray':           { in: 'ints',     out: 'int',    fn: 'maxSubArray',            jret: 'int',      cret: 'int' },
  'longest-substring-no-repeat':{ in: 'str',      out: 'int',    fn: 'lengthOfLongestSubstring', jret: 'int',    cret: 'int' },
  'house-robber':               { in: 'ints',     out: 'int',    fn: 'rob',                    jret: 'int',      cret: 'int' },
  'coin-change':                { in: 'ints_int', out: 'int',    fn: 'coinChange',             jret: 'int',      cret: 'int' },
  'number-of-islands':          { in: 'strs',     out: 'int',    fn: 'numIslands',             jret: 'int',      cret: 'int' },
  'trapping-rain-water':        { in: 'ints',     out: 'int',    fn: 'trap',                   jret: 'int',      cret: 'int' },
  'edit-distance':              { in: 'str_str',  out: 'int',    fn: 'minDistance',            jret: 'int',      cret: 'int' },
  'contains-duplicate':         { in: 'ints',     out: 'bool',   fn: 'containsDuplicate',      jret: 'boolean',  cret: 'bool' },
  'valid-anagram':              { in: 'str_str',  out: 'bool',   fn: 'isAnagram',              jret: 'boolean',  cret: 'bool' },
  'best-time-to-buy-sell-stock':{ in: 'ints',     out: 'int',    fn: 'maxProfit',              jret: 'int',      cret: 'int' },
  'climbing-stairs':            { in: 'int',      out: 'int',    fn: 'climbStairs',            jret: 'int',      cret: 'int' },
  'binary-search':              { in: 'ints_int', out: 'int',    fn: 'search',                 jret: 'int',      cret: 'int' },
  'majority-element':           { in: 'ints',     out: 'int',    fn: 'majorityElement',        jret: 'int',      cret: 'int' },
  'single-number':              { in: 'ints',     out: 'int',    fn: 'singleNumber',           jret: 'int',      cret: 'int' },
  'product-except-self':        { in: 'ints',     out: 'intarr', fn: 'productExceptSelf',      jret: 'int[]',    cret: 'vector<int>' },
  'move-zeroes':                { in: 'ints',     out: 'intarr', fn: 'moveZeroes',             jret: 'int[]',    cret: 'vector<int>' },
  'longest-common-prefix':      { in: 'strs',     out: 'str',    fn: 'longestCommonPrefix',    jret: 'String',   cret: 'string' },
  'roman-to-integer':           { in: 'str',      out: 'int',    fn: 'romanToInt',             jret: 'int',      cret: 'int' },
  'fizzbuzz':                   { in: 'int',      out: 'strarr', fn: 'fizzBuzz',               jret: 'String[]', cret: 'vector<string>' },
  'vowel-count':                { in: 'str',      out: 'int',    fn: 'countVowels',            jret: 'int',      cret: 'int' },
  'caesar-cipher':              { in: 'str_int',  out: 'str',    fn: 'caesarCipher',           jret: 'String',   cret: 'string' },
  'run-length-encode':          { in: 'str',      out: 'str',    fn: 'runLengthEncode',        jret: 'String',   cret: 'string' },
  'digital-root':               { in: 'int',      out: 'int',    fn: 'digitalRoot',            jret: 'int',      cret: 'int' },
};

// Java / C++ parameter declarations for the function signature.
const JAVA_PARAMS = {
  ints:     'int[] nums',
  ints_int: 'int[] nums, int target',
  str:      'String s',
  str_str:  'String word1, String word2',
  str_int:  'String s, int shift',
  int:      'int n',
  strs:     'String[] strs',
};
const CPP_PARAMS = {
  ints:     'vector<int>& nums',
  ints_int: 'vector<int>& nums, int target',
  str:      'string s',
  str_str:  'string word1, string word2',
  str_int:  'string s, int shift',
  int:      'int n',
  strs:     'vector<string>& strs',
};
const JAVA_DEFAULT = { int: 'return 0;', bool: 'return false;', str: 'return "";', intarr: 'return new int[]{};', strarr: 'return new String[]{};' };
const CPP_DEFAULT  = { int: 'return 0;', bool: 'return false;', str: 'return "";', intarr: 'return {};',          strarr: 'return {};' };

// ---- starter code -----------------------------------------------------------
function javaStarter(s) {
  // No import line: the hidden harness runs first (Piston's single-file launcher
  // executes the first class) and pre-imports java.util.*, so a top-level import
  // here would land mid-file and fail to compile. java.util.* is available.
  return [
    'class Solution {',
    `    ${s.jret} ${s.fn}(${JAVA_PARAMS[s.in]}) {`,
    '        // your code here (java.util.* is already imported)',
    `        ${JAVA_DEFAULT[s.out]}`,
    '    }',
    '}',
    '',
  ].join('\n');
}
function cppStarter(s) {
  return [
    '#include <bits/stdc++.h>',
    'using namespace std;',
    '',
    `${s.cret} ${s.fn}(${CPP_PARAMS[s.in]}) {`,
    '    // your code here',
    `    ${CPP_DEFAULT[s.out]}`,
    '}',
    '',
  ].join('\n');
}

// ---- harness helper blocks (only emit what each problem needs) ---------------
const J = {
  readLines:
    '    static String[] L() throws Exception {\n' +
    '        String[] a = new String(System.in.readAllBytes()).split("\\n", -1);\n' +
    '        for (int i = 0; i < a.length; i++) if (a[i].endsWith("\\r")) a[i] = a[i].substring(0, a[i].length() - 1);\n' +
    '        return a;\n' +
    '    }',
  parseInts:
    '    static int[] pi(String s) {\n' +
    '        int a = s.indexOf(\'[\'), b = s.lastIndexOf(\']\');\n' +
    '        if (a >= 0 && b >= 0) s = s.substring(a + 1, b);\n' +
    '        s = s.trim();\n' +
    '        if (s.isEmpty()) return new int[0];\n' +
    '        String[] p = s.split(",");\n' +
    '        int[] r = new int[p.length];\n' +
    '        for (int i = 0; i < p.length; i++) r[i] = Integer.parseInt(p[i].trim());\n' +
    '        return r;\n' +
    '    }',
  parseStrings:
    '    static String[] ps(String s) {\n' +
    '        java.util.List<String> o = new java.util.ArrayList<>();\n' +
    '        boolean in = false; StringBuilder c = new StringBuilder();\n' +
    '        for (int i = 0; i < s.length(); i++) {\n' +
    '            char ch = s.charAt(i);\n' +
    '            if (ch == \'"\') { if (in) { o.add(c.toString()); c.setLength(0); in = false; } else in = true; }\n' +
    '            else if (in) c.append(ch);\n' +
    '        }\n' +
    '        return o.toArray(new String[0]);\n' +
    '    }',
  ints:
    '    static String ia(int[] a) {\n' +
    '        StringBuilder b = new StringBuilder("[");\n' +
    '        for (int i = 0; i < a.length; i++) { if (i > 0) b.append(\',\'); b.append(a[i]); }\n' +
    '        return b.append(\']\').toString();\n' +
    '    }',
  strs:
    '    static String sa(String[] a) {\n' +
    '        StringBuilder b = new StringBuilder("[");\n' +
    '        for (int i = 0; i < a.length; i++) { if (i > 0) b.append(\',\'); b.append(\'"\').append(a[i]).append(\'"\'); }\n' +
    '        return b.append(\']\').toString();\n' +
    '    }',
};
const C = {
  readLines:
    'static vector<string> RL(){string a((istreambuf_iterator<char>(cin)),istreambuf_iterator<char>());vector<string> r;string c;for(char ch:a){if(ch==\'\\n\'){if(!c.empty()&&c.back()==\'\\r\')c.pop_back();r.push_back(c);c.clear();}else c.push_back(ch);}if(!c.empty()&&c.back()==\'\\r\')c.pop_back();r.push_back(c);return r;}',
  parseInts:
    'static vector<int> PI(const string& s){string t;for(char c:s)t+=(c==\'[\'||c==\']\'||c==\',\')?\' \':c;vector<int> r;stringstream ss(t);int x;while(ss>>x)r.push_back(x);return r;}',
  parseStrings:
    'static vector<string> PS(const string& s){vector<string> r;bool in=false;string c;for(char ch:s){if(ch==\'"\'){if(in){r.push_back(c);c.clear();in=false;}else in=true;}else if(in)c+=ch;}return r;}',
  ints:
    'static string IA(const vector<int>& a){string o="[";for(size_t i=0;i<a.size();i++){if(i)o+=",";o+=to_string(a[i]);}return o+"]";}',
  strs:
    'static string SA(const vector<string>& a){string o="[";for(size_t i=0;i<a.size();i++){if(i)o+=",";o+="\\""+a[i]+"\\"";}return o+"]";}',
};

// ---- per-problem harness body -----------------------------------------------
function build(s) {
  const jHelp = new Set(['readLines']);
  const cHelp = new Set(['readLines']);
  let jArgs, cPre, cArgs;
  switch (s.in) {
    case 'ints':     jHelp.add('parseInts'); cHelp.add('parseInts');
      jArgs = 'pi(x[0])'; cPre = 'auto a0=PI(x[0]);'; cArgs = 'a0'; break;
    case 'ints_int': jHelp.add('parseInts'); cHelp.add('parseInts');
      jArgs = 'pi(x[0]), Integer.parseInt(x[1].trim())'; cPre = 'auto a0=PI(x[0]);int a1=stoi(x[1]);'; cArgs = 'a0, a1'; break;
    case 'str':      jArgs = 'x[0]'; cPre = ''; cArgs = 'x[0]'; break;
    case 'str_str':  jArgs = 'x[0], x[1]'; cPre = ''; cArgs = 'x[0], x[1]'; break;
    case 'str_int':  jArgs = 'x[0], Integer.parseInt(x[1].trim())'; cPre = 'int a1=stoi(x[1]);'; cArgs = 'x[0], a1'; break;
    case 'int':      jArgs = 'Integer.parseInt(x[0].trim())'; cPre = 'int a0=stoi(x[0]);'; cArgs = 'a0'; break;
    case 'strs':     jHelp.add('parseStrings'); cHelp.add('parseStrings');
      jArgs = 'ps(x[0])'; cPre = 'auto a0=PS(x[0]);'; cArgs = 'a0'; break;
  }
  const jCall = `sol.${s.fn}(${jArgs})`;
  const cCall = `${s.fn}(${cArgs})`;
  let jBody, cBody;
  switch (s.out) {
    case 'int':    jBody = `System.out.println(${jCall});`; cBody = `cout << ${cCall} << "\\n";`; break;
    case 'bool':   jBody = `System.out.println(${jCall});`; cBody = `cout << (${cCall} ? "true" : "false") << "\\n";`; break;
    case 'str':    jBody = `System.out.println(${jCall});`; cBody = `cout << ${cCall} << "\\n";`; break;
    case 'intarr': jHelp.add('ints'); cHelp.add('ints');
      jBody = `System.out.println(ia(${jCall}));`; cBody = `cout << IA(${cCall}) << "\\n";`; break;
    case 'strarr': jHelp.add('strs'); cHelp.add('strs');
      jBody = `System.out.println(sa(${jCall}));`; cBody = `cout << SA(${cCall}) << "\\n";`; break;
  }
  return { jHelp, jBody, cHelp, cPre, cBody };
}

const ORDER = ['readLines', 'parseInts', 'parseStrings', 'ints', 'strs'];

function javaHarness(s) {
  const { jHelp, jBody } = build(s);
  const helpers = ORDER.filter((h) => jHelp.has(h)).map((h) => J[h]).join('\n');
  // Imports must be at the very top of the file; this harness is placed FIRST
  // (before the user's class Solution) by testRunner.buildSource for Java.
  return [
    'import java.util.*;',
    '',
    'public class Main {',
    helpers,
    '    public static void main(String[] args) throws Exception {',
    '        String[] x = L();',
    '        Solution sol = new Solution();',
    `        ${jBody}`,
    '    }',
    '}',
    '',
  ].join('\n');
}
function cppHarness(s) {
  const { cHelp, cPre, cBody } = build(s);
  const helpers = ORDER.filter((h) => cHelp.has(h)).map((h) => C[h]).join('\n');
  return [
    '',
    helpers,
    'int main(){',
    '    vector<string> x = RL();',
    ...(cPre ? [`    ${cPre}`] : []),
    `    ${cBody}`,
    '    return 0;',
    '}',
    '',
  ].join('\n');
}

// ---- apply ------------------------------------------------------------------
let changed = 0;
for (const p of problems) {
  const s = SPEC[p.id];
  if (!s) { console.error('!! no spec for', p.id); process.exit(1); }
  p.starterCode.java = javaStarter(s);
  p.starterCode.cpp = cppStarter(s);
  p.harness.java = javaHarness(s);
  p.harness.cpp = cppHarness(s);
  changed++;
}
fs.writeFileSync(file, JSON.stringify(problems, null, 2) + '\n');
console.log(`updated ${changed} problems with java + cpp`);
