#!/usr/bin/env node
/*
 * Validation harness: for each problem, combine a known-correct REFERENCE
 * solution with the GENERATED harness, run it through a local Piston against
 * every test case, and compare normalized stdout to expectedStdout.
 *
 * This proves the generated java/cpp harnesses parse input and format output
 * exactly like the existing js/ts/python ones. Run AFTER gen-java-cpp.cjs.
 *
 * Usage: node scripts/validate-java-cpp.cjs            (defaults to localhost:2000)
 *        PISTON=http://localhost:2000/api/v2 node scripts/validate-java-cpp.cjs
 */
const fs = require('fs');
const path = require('path');
const PISTON = process.env.PISTON || 'http://localhost:2000/api/v2';
const problems = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'problems.json'), 'utf8'));

function normalize(s) {
  return s.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

// Reference solutions (full solution files, matching the generated signatures).
const REF = {
  'two-sum': {
    java: `class Solution{ int[] twoSum(int[] nums,int target){ Map<Integer,Integer> m=new HashMap<>(); for(int i=0;i<nums.length;i++){ if(m.containsKey(target-nums[i])) return new int[]{m.get(target-nums[i]),i}; m.put(nums[i],i);} return new int[]{}; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums,int target){ unordered_map<int,int> m; for(int i=0;i<(int)nums.size();i++){ if(m.count(target-nums[i])) return {m[target-nums[i]],i}; m[nums[i]]=i;} return {}; }`,
  },
  'valid-parentheses': {
    java: `class Solution{ boolean isValid(String s){ Deque<Character> st=new ArrayDeque<>(); for(char c:s.toCharArray()){ if(c=='('||c=='['||c=='{') st.push(c); else { if(st.isEmpty())return false; char t=st.pop(); if(c==')'&&t!='(')return false; if(c==']'&&t!='[')return false; if(c=='}'&&t!='{')return false; } } return st.isEmpty(); } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nbool isValid(string s){ stack<char> st; for(char c:s){ if(c=='('||c=='['||c=='{') st.push(c); else { if(st.empty())return false; char t=st.top(); st.pop(); if(c==')'&&t!='(')return false; if(c==']'&&t!='[')return false; if(c=='}'&&t!='{')return false; } } return st.empty(); }`,
  },
  'reverse-string': {
    java: `class Solution{ String reverseString(String s){ return new StringBuilder(s).reverse().toString(); } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nstring reverseString(string s){ reverse(s.begin(),s.end()); return s; }`,
  },
  'maximum-subarray': {
    java: `class Solution{ int maxSubArray(int[] nums){ int best=nums[0],cur=nums[0]; for(int i=1;i<nums.length;i++){ cur=Math.max(nums[i],cur+nums[i]); best=Math.max(best,cur);} return best; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint maxSubArray(vector<int>& nums){ int best=nums[0],cur=nums[0]; for(int i=1;i<(int)nums.size();i++){ cur=max(nums[i],cur+nums[i]); best=max(best,cur);} return best; }`,
  },
  'longest-substring-no-repeat': {
    java: `class Solution{ int lengthOfLongestSubstring(String s){ int[] last=new int[256]; Arrays.fill(last,-1); int start=0,best=0; for(int i=0;i<s.length();i++){ char c=s.charAt(i); if(last[c]>=start)start=last[c]+1; last[c]=i; best=Math.max(best,i-start+1);} return best; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint lengthOfLongestSubstring(string s){ vector<int> last(256,-1); int start=0,best=0; for(int i=0;i<(int)s.size();i++){ unsigned char c=s[i]; if(last[c]>=start)start=last[c]+1; last[c]=i; best=max(best,i-start+1);} return best; }`,
  },
  'house-robber': {
    java: `class Solution{ int rob(int[] nums){ int prev=0,cur=0; for(int n:nums){ int t=Math.max(cur,prev+n); prev=cur; cur=t;} return cur; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint rob(vector<int>& nums){ int prev=0,cur=0; for(int n:nums){ int t=max(cur,prev+n); prev=cur; cur=t;} return cur; }`,
  },
  'coin-change': {
    java: `class Solution{ int coinChange(int[] coins,int amount){ int[] dp=new int[amount+1]; Arrays.fill(dp,amount+1); dp[0]=0; for(int a=1;a<=amount;a++) for(int c:coins) if(c<=a) dp[a]=Math.min(dp[a],dp[a-c]+1); return dp[amount]>amount?-1:dp[amount]; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint coinChange(vector<int>& coins,int amount){ vector<int> dp(amount+1,amount+1); dp[0]=0; for(int a=1;a<=amount;a++) for(int c:coins) if(c<=a) dp[a]=min(dp[a],dp[a-c]+1); return dp[amount]>amount?-1:dp[amount]; }`,
  },
  'number-of-islands': {
    java: `class Solution{ int numIslands(String[] grid){ if(grid.length==0)return 0; char[][] g=new char[grid.length][]; for(int i=0;i<grid.length;i++)g[i]=grid[i].toCharArray(); int count=0; for(int i=0;i<g.length;i++)for(int j=0;j<g[i].length;j++) if(g[i][j]=='1'){count++; dfs(g,i,j);} return count; } void dfs(char[][] g,int i,int j){ if(i<0||j<0||i>=g.length||j>=g[i].length||g[i][j]!='1')return; g[i][j]='0'; dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);} }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nvoid dfs(vector<string>& g,int i,int j){ if(i<0||j<0||i>=(int)g.size()||j>=(int)g[i].size()||g[i][j]!='1')return; g[i][j]='0'; dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);}\nint numIslands(vector<string>& grid){ int count=0; for(int i=0;i<(int)grid.size();i++)for(int j=0;j<(int)grid[i].size();j++) if(grid[i][j]=='1'){count++; dfs(grid,i,j);} return count; }`,
  },
  'trapping-rain-water': {
    java: `class Solution{ int trap(int[] height){ int l=0,r=height.length-1,lm=0,rm=0,res=0; while(l<r){ if(height[l]<height[r]){ if(height[l]>=lm)lm=height[l]; else res+=lm-height[l]; l++;} else { if(height[r]>=rm)rm=height[r]; else res+=rm-height[r]; r--;} } return res; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint trap(vector<int>& height){ int l=0,r=(int)height.size()-1,lm=0,rm=0,res=0; while(l<r){ if(height[l]<height[r]){ if(height[l]>=lm)lm=height[l]; else res+=lm-height[l]; l++;} else { if(height[r]>=rm)rm=height[r]; else res+=rm-height[r]; r--;} } return res; }`,
  },
  'edit-distance': {
    java: `class Solution{ int minDistance(String word1,String word2){ int m=word1.length(),n=word2.length(); int[][] dp=new int[m+1][n+1]; for(int i=0;i<=m;i++)dp[i][0]=i; for(int j=0;j<=n;j++)dp[0][j]=j; for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){ if(word1.charAt(i-1)==word2.charAt(j-1))dp[i][j]=dp[i-1][j-1]; else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));} return dp[m][n]; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint minDistance(string word1,string word2){ int m=word1.size(),n=word2.size(); vector<vector<int>> dp(m+1,vector<int>(n+1)); for(int i=0;i<=m;i++)dp[i][0]=i; for(int j=0;j<=n;j++)dp[0][j]=j; for(int i=1;i<=m;i++)for(int j=1;j<=n;j++){ if(word1[i-1]==word2[j-1])dp[i][j]=dp[i-1][j-1]; else dp[i][j]=1+min(dp[i-1][j-1],min(dp[i-1][j],dp[i][j-1]));} return dp[m][n]; }`,
  },
  'contains-duplicate': {
    java: `class Solution{ boolean containsDuplicate(int[] nums){ Set<Integer> s=new HashSet<>(); for(int n:nums) if(!s.add(n))return true; return false; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nbool containsDuplicate(vector<int>& nums){ unordered_set<int> s; for(int n:nums){ if(s.count(n))return true; s.insert(n);} return false; }`,
  },
  'valid-anagram': {
    java: `class Solution{ boolean isAnagram(String word1,String word2){ if(word1.length()!=word2.length())return false; int[] c=new int[256]; for(char ch:word1.toCharArray())c[ch]++; for(char ch:word2.toCharArray())if(--c[ch]<0)return false; return true; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nbool isAnagram(string word1,string word2){ if(word1.size()!=word2.size())return false; vector<int> c(256,0); for(unsigned char ch:word1)c[ch]++; for(unsigned char ch:word2)if(--c[ch]<0)return false; return true; }`,
  },
  'best-time-to-buy-sell-stock': {
    java: `class Solution{ int maxProfit(int[] prices){ int min=Integer.MAX_VALUE,best=0; for(int p:prices){ min=Math.min(min,p); best=Math.max(best,p-min);} return best; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint maxProfit(vector<int>& prices){ int mn=INT_MAX,best=0; for(int p:prices){ mn=min(mn,p); best=max(best,p-mn);} return best; }`,
  },
  'climbing-stairs': {
    java: `class Solution{ int climbStairs(int n){ int a=1,b=1; for(int i=0;i<n;i++){ int t=a+b; a=b; b=t;} return a; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint climbStairs(int n){ int a=1,b=1; for(int i=0;i<n;i++){ int t=a+b; a=b; b=t;} return a; }`,
  },
  'binary-search': {
    java: `class Solution{ int search(int[] nums,int target){ int lo=0,hi=nums.length-1; while(lo<=hi){ int mid=(lo+hi)/2; if(nums[mid]==target)return mid; if(nums[mid]<target)lo=mid+1; else hi=mid-1;} return -1; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint search(vector<int>& nums,int target){ int lo=0,hi=(int)nums.size()-1; while(lo<=hi){ int mid=(lo+hi)/2; if(nums[mid]==target)return mid; if(nums[mid]<target)lo=mid+1; else hi=mid-1;} return -1; }`,
  },
  'majority-element': {
    java: `class Solution{ int majorityElement(int[] nums){ int count=0,cand=0; for(int n:nums){ if(count==0)cand=n; count+=(n==cand)?1:-1;} return cand; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint majorityElement(vector<int>& nums){ int count=0,cand=0; for(int n:nums){ if(count==0)cand=n; count+=(n==cand)?1:-1;} return cand; }`,
  },
  'single-number': {
    java: `class Solution{ int singleNumber(int[] nums){ int x=0; for(int n:nums)x^=n; return x; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint singleNumber(vector<int>& nums){ int x=0; for(int n:nums)x^=n; return x; }`,
  },
  'product-except-self': {
    java: `class Solution{ int[] productExceptSelf(int[] nums){ int n=nums.length; int[] res=new int[n]; res[0]=1; for(int i=1;i<n;i++)res[i]=res[i-1]*nums[i-1]; int r=1; for(int i=n-1;i>=0;i--){res[i]*=r; r*=nums[i];} return res; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nvector<int> productExceptSelf(vector<int>& nums){ int n=nums.size(); vector<int> res(n,1); for(int i=1;i<n;i++)res[i]=res[i-1]*nums[i-1]; int r=1; for(int i=n-1;i>=0;i--){res[i]*=r; r*=nums[i];} return res; }`,
  },
  'move-zeroes': {
    java: `class Solution{ int[] moveZeroes(int[] nums){ int j=0; for(int i=0;i<nums.length;i++) if(nums[i]!=0)nums[j++]=nums[i]; while(j<nums.length)nums[j++]=0; return nums; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nvector<int> moveZeroes(vector<int>& nums){ int j=0; for(int i=0;i<(int)nums.size();i++) if(nums[i]!=0)nums[j++]=nums[i]; while(j<(int)nums.size())nums[j++]=0; return nums; }`,
  },
  'longest-common-prefix': {
    java: `class Solution{ String longestCommonPrefix(String[] strs){ if(strs.length==0)return ""; String p=strs[0]; for(String s:strs){ int i=0; while(i<p.length()&&i<s.length()&&p.charAt(i)==s.charAt(i))i++; p=p.substring(0,i);} return p; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nstring longestCommonPrefix(vector<string>& strs){ if(strs.empty())return ""; string p=strs[0]; for(string& s:strs){ int i=0; while(i<(int)p.size()&&i<(int)s.size()&&p[i]==s[i])i++; p=p.substr(0,i);} return p; }`,
  },
  'roman-to-integer': {
    java: `class Solution{ int romanToInt(String s){ Map<Character,Integer> m=new HashMap<>(); m.put('I',1);m.put('V',5);m.put('X',10);m.put('L',50);m.put('C',100);m.put('D',500);m.put('M',1000); int total=0; for(int i=0;i<s.length();i++){ int v=m.get(s.charAt(i)); if(i+1<s.length()&&v<m.get(s.charAt(i+1)))total-=v; else total+=v;} return total; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint romanToInt(string s){ unordered_map<char,int> m={{'I',1},{'V',5},{'X',10},{'L',50},{'C',100},{'D',500},{'M',1000}}; int total=0; for(int i=0;i<(int)s.size();i++){ int v=m[s[i]]; if(i+1<(int)s.size()&&v<m[s[i+1]])total-=v; else total+=v;} return total; }`,
  },
  'fizzbuzz': {
    java: `class Solution{ String[] fizzBuzz(int n){ String[] r=new String[n]; for(int i=1;i<=n;i++){ if(i%15==0)r[i-1]="FizzBuzz"; else if(i%3==0)r[i-1]="Fizz"; else if(i%5==0)r[i-1]="Buzz"; else r[i-1]=String.valueOf(i);} return r; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nvector<string> fizzBuzz(int n){ vector<string> r; for(int i=1;i<=n;i++){ if(i%15==0)r.push_back("FizzBuzz"); else if(i%3==0)r.push_back("Fizz"); else if(i%5==0)r.push_back("Buzz"); else r.push_back(to_string(i));} return r; }`,
  },
  'vowel-count': {
    java: `class Solution{ int countVowels(String s){ int c=0; for(char ch:s.toLowerCase().toCharArray()) if("aeiou".indexOf(ch)>=0)c++; return c; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint countVowels(string s){ int c=0; for(char ch:s){ char l=tolower(ch); if(l=='a'||l=='e'||l=='i'||l=='o'||l=='u')c++;} return c; }`,
  },
  'caesar-cipher': {
    java: `class Solution{ String caesarCipher(String s,int shift){ StringBuilder sb=new StringBuilder(); for(char c:s.toCharArray()){ if(c>='a'&&c<='z')sb.append((char)('a'+(c-'a'+shift%26+26)%26)); else if(c>='A'&&c<='Z')sb.append((char)('A'+(c-'A'+shift%26+26)%26)); else sb.append(c);} return sb.toString(); } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nstring caesarCipher(string s,int shift){ string o; for(char c:s){ if(c>='a'&&c<='z')o+=(char)('a'+((c-'a'+shift%26+26)%26)); else if(c>='A'&&c<='Z')o+=(char)('A'+((c-'A'+shift%26+26)%26)); else o+=c;} return o; }`,
  },
  'run-length-encode': {
    java: `class Solution{ String runLengthEncode(String s){ StringBuilder sb=new StringBuilder(); int i=0; while(i<s.length()){ char c=s.charAt(i); int j=i; while(j<s.length()&&s.charAt(j)==c)j++; sb.append(c).append(j-i); i=j;} return sb.toString(); } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nstring runLengthEncode(string s){ string o; int i=0; while(i<(int)s.size()){ char c=s[i]; int j=i; while(j<(int)s.size()&&s[j]==c)j++; o+=c; o+=to_string(j-i); i=j;} return o; }`,
  },
  'digital-root': {
    java: `class Solution{ int digitalRoot(int n){ while(n>=10){ int s=0; while(n>0){s+=n%10;n/=10;} n=s;} return n; } }`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\nint digitalRoot(int n){ while(n>=10){ int s=0; while(n>0){s+=n%10;n/=10;} n=s;} return n; }`,
  },
};

const FILE_NAME = { java: 'Main.java', cpp: 'main.cpp' };
const PISTON_LANG = { java: 'java', cpp: 'c++' };

async function getVersion(lang) {
  const res = await fetch(`${PISTON}/runtimes`);
  const runtimes = await res.json();
  const target = PISTON_LANG[lang];
  const m = runtimes.find((r) => r.language === target || (r.aliases || []).includes(target));
  if (!m) throw new Error(`no runtime for ${lang}`);
  return m.version;
}

async function run(lang, version, source, stdin) {
  const res = await fetch(`${PISTON}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: PISTON_LANG[lang], version,
      files: [{ name: FILE_NAME[lang], content: source }],
      stdin, run_timeout: 3000, compile_timeout: 10000,
    }),
  });
  return res.json();
}

(async () => {
  const versions = { java: await getVersion('java'), cpp: await getVersion('cpp') };
  console.log('versions:', versions);
  let totalFail = 0;
  for (const lang of ['java', 'cpp']) {
    console.log(`\n==================== ${lang.toUpperCase()} ====================`);
    for (const p of problems) {
      const ref = REF[p.id]?.[lang];
      if (!ref) { console.log(`?? ${p.id}: NO REF`); totalFail++; continue; }
      // Mirror testRunner.buildSource: Java puts the harness FIRST.
      const source = lang === 'java' ? `${p.harness[lang]}\n\n${ref}` : `${ref}\n\n${p.harness[lang]}`;
      let probFail = 0; let firstErr = '';
      for (const tc of p.testCases) {
        const r = await run(lang, versions[lang], source, tc.stdin);
        if (r.compile && r.compile.code !== 0) { probFail++; firstErr = firstErr || 'COMPILE: ' + (r.compile.stderr || '').split('\n').slice(0, 3).join(' | '); continue; }
        const actual = normalize(r.run.stdout || '');
        if (r.run.code !== 0) { probFail++; firstErr = firstErr || 'RUN code ' + r.run.code + ': ' + (r.run.stderr || '').split('\n')[0]; continue; }
        if (actual !== normalize(tc.expectedStdout)) { probFail++; firstErr = firstErr || `got "${actual}" want "${normalize(tc.expectedStdout)}"`; }
      }
      if (probFail === 0) console.log(`PASS ${p.id} (${p.testCases.length} cases)`);
      else { console.log(`FAIL ${p.id} - ${probFail}/${p.testCases.length} - ${firstErr}`); totalFail += probFail; }
    }
  }
  console.log(`\n${totalFail === 0 ? 'ALL PASS' : 'FAILURES: ' + totalFail}`);
  process.exit(totalFail === 0 ? 0 : 1);
})();
