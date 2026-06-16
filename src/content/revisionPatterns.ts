/**
 * Revision content for the /revise page: the core interview "patterns" (algorithmic
 * techniques) and abstract data types (ADTs), each with a plain-English explanation,
 * the signals that should make you reach for it, why it works, a tiny sketch, and
 * worked example problems that link straight into a real session on the site.
 *
 * Example `problemId`s map to entries in src/data/problems.json, so the "Try it" links
 * open /session/:problemId. Keep them in sync if a problem id ever changes.
 */

export type PatternCategory = 'technique' | 'structure' | 'theory';

export interface PatternExample {
  /** Must match a problem id in problems.json so the link resolves. */
  problemId: string;
  title: string;
  /** One line on *why this problem is a good fit* for the pattern. */
  note: string;
}

export interface RevisionPattern {
  id: string;
  name: string;
  category: PatternCategory;
  /** Short tagline shown under the heading. */
  oneLiner: string;
  /** What it is, in plain English. */
  whatItIs: string;
  /** "Reach for this when you see..." - the trigger signals in a problem. */
  whenToUse: string[];
  /** Why it beats the naive approach. */
  whyItWorks: string;
  /** Rough complexity you should expect to land on. */
  complexity: string;
  /** Tiny language-neutral sketch (Python-ish pseudocode). */
  sketch: string;
  /** Language the sketch is written in, shown as a badge. Defaults to Python. */
  language?: string;
  examples: PatternExample[];
}

export const PATTERNS: RevisionPattern[] = [
  // ───────────────────────────── Techniques ─────────────────────────────
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    category: 'technique',
    oneLiner: 'Walk two indices through a sequence instead of nesting two loops.',
    whatItIs:
      'You keep two indices into the same array (or string) and move them based on a condition. The classic forms are opposite ends moving inward, and a slow/fast pair moving in the same direction.',
    whenToUse: [
      'The array is sorted, or sorting it first does not lose the answer.',
      'You are looking for a pair / triple that meets some target.',
      'You need to reverse, partition, or compress in place with O(1) extra space.',
      'A brute-force solution is an O(n²) double loop and you want O(n).',
    ],
    whyItWorks:
      'Each pointer only ever moves in one direction, so together they touch each element a constant number of times - turning an O(n²) scan of all pairs into a single O(n) pass.',
    complexity: 'Typically O(n) time, O(1) extra space.',
    sketch: `l, r = 0, len(a) - 1
while l < r:
    if condition(a[l], a[r]):
        # record / move both inward
        l += 1; r -= 1
    elif a[l] too_small:
        l += 1
    else:
        r -= 1`,
    examples: [
      { problemId: 'reverse-string', title: 'Reverse String', note: 'Swap ends inward - the textbook opposite-ends pair.' },
      { problemId: 'move-zeroes', title: 'Move Zeroes', note: 'Slow/fast pair partitions non-zeros in place.' },
      { problemId: 'container-most-water', title: 'Container With Most Water', note: 'Shrink from the wider side to beat O(n²).' },
      { problemId: 'trapping-rain-water', title: 'Trapping Rain Water', note: 'Two pointers + running max heights in one pass.' },
    ],
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    category: 'technique',
    oneLiner: 'Maintain a moving sub-range and update an answer as it grows and shrinks.',
    whatItIs:
      'A specialised two-pointer pattern over a contiguous range. You expand the right edge to include new elements, and contract the left edge when the window breaks a constraint, carrying a running summary (sum, count, frequency map) instead of recomputing it.',
    whenToUse: [
      'The problem says "contiguous subarray" or "substring".',
      'You want the longest / shortest / best window meeting a constraint.',
      'A brute force re-scans every subarray (O(n²) or worse).',
      'You can update the window summary in O(1) as it slides.',
    ],
    whyItWorks:
      'The left and right edges each advance at most n times across the whole run, so the total work is O(n) even though it conceptually visits many windows.',
    complexity: 'O(n) time; O(k) space for the window summary.',
    sketch: `left = 0
for right in range(n):
    add(a[right])
    while window_invalid():
        remove(a[left]); left += 1
    best = better(best, right - left + 1)`,
    examples: [
      { problemId: 'longest-substring-no-repeat', title: 'Longest Substring Without Repeating Characters', note: 'Grow/shrink a window of distinct chars.' },
      { problemId: 'best-time-to-buy-sell-stock', title: 'Best Time to Buy and Sell Stock', note: 'One pass tracking the lowest price so far.' },
      { problemId: 'sliding-window-maximum', title: 'Sliding Window Maximum', note: 'Fixed-size window backed by a monotonic deque.' },
    ],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'technique',
    oneLiner: 'Halve the search space each step using a monotonic property.',
    whatItIs:
      'Repeatedly look at the middle of a sorted (or otherwise monotonic) range and discard the half that cannot contain the answer. It also works on an abstract "answer space" - binary searching the answer itself.',
    whenToUse: [
      'The data is sorted, or rotated-but-sorted.',
      'There is a monotonic yes/no test: once true it stays true.',
      'Inputs are large (n up to 10⁵–10⁹) and you need O(log n).',
      'You are asked for the smallest/largest value that satisfies a condition.',
    ],
    whyItWorks:
      'Discarding half the candidates every comparison gives log₂(n) steps - about 30 checks even for a billion elements.',
    complexity: 'O(log n) time, O(1) space.',
    sketch: `lo, hi = 0, n - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if a[mid] == target: return mid
    if a[mid] < target: lo = mid + 1
    else: hi = mid - 1`,
    examples: [
      { problemId: 'binary-search', title: 'Binary Search', note: 'The canonical sorted-array search.' },
      { problemId: 'search-rotated-array', title: 'Search in Rotated Sorted Array', note: 'Decide which half is sorted, then recurse into it.' },
    ],
  },
  {
    id: 'dfs-recursion',
    name: 'DFS & Recursion',
    category: 'technique',
    oneLiner: 'Solve a problem by solving smaller copies of itself, going deep first.',
    whatItIs:
      'Depth-first search explores one path as far as possible before backtracking. On grids and graphs it floods connected regions; on trees and decision spaces it is just recursion - a base case plus calls on smaller subproblems. The call stack does the bookkeeping for you.',
    whenToUse: [
      'A grid/graph asks for connected regions, reachability, or a path.',
      'The structure is naturally recursive: trees, nested data, "explore all options".',
      'You can phrase the answer in terms of answers to smaller inputs.',
      'You need to visit every node and a queue (BFS) is not required for shortest-path.',
    ],
    whyItWorks:
      'Marking nodes as visited means each is processed once, so a full traversal is linear in (nodes + edges). Recursion mirrors the structure of the data, keeping the code small and the state on the stack.',
    complexity: 'O(V + E) for graphs/grids; recursion depth = longest path.',
    sketch: `def dfs(r, c):
    if out_of_bounds or visited[r][c] or blocked: return
    visited[r][c] = True
    for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
        dfs(r+dr, c+dc)`,
    examples: [
      { problemId: 'number-of-islands', title: 'Number of Islands', note: 'Flood-fill each unvisited land cell; count the floods.' },
    ],
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    category: 'technique',
    oneLiner: 'Cache answers to overlapping subproblems so you solve each one once.',
    whatItIs:
      'Break the problem into subproblems, define a recurrence linking them, and store each result (a table, or memoised recursion) so it is never recomputed. The hard part is finding the state and the transition.',
    whenToUse: [
      'You are asked for a count, a min/max, or "is it possible" over choices.',
      'Greedy gives wrong answers because a local best ruins a later step.',
      'A recursive solution recomputes the same inputs (overlapping subproblems).',
      'Each step has a small set of choices and an optimal-substructure feel.',
    ],
    whyItWorks:
      'Without caching, the recursion tree is exponential. Storing each distinct state collapses it to (number of states × work per transition), usually polynomial.',
    complexity: 'Often O(n) or O(n·m) time and space; space can drop to O(1)/O(n) by rolling rows.',
    sketch: `dp[0] = base
for i in range(1, n + 1):
    dp[i] = best_over_choices(dp[i - 1], dp[i - 2], ...)
return dp[n]`,
    examples: [
      { problemId: 'climbing-stairs', title: 'Climbing Stairs', note: 'dp[i] = dp[i-1] + dp[i-2] - Fibonacci in disguise.' },
      { problemId: 'house-robber', title: 'House Robber', note: 'Take-or-skip choice at each house.' },
      { problemId: 'coin-change', title: 'Coin Change', note: 'Fewest coins for each amount up to the target.' },
      { problemId: 'edit-distance', title: 'Edit Distance', note: '2-D table over prefixes of both strings.' },
    ],
  },
  {
    id: 'greedy',
    name: 'Greedy',
    category: 'technique',
    oneLiner: 'Take the locally best choice and never look back.',
    whatItIs:
      'At each step you commit to whatever looks best right now, trusting that these local optima compose into a global one. It only works when the problem has the "greedy-choice property" - and proving (or sanity-checking) that is the real work.',
    whenToUse: [
      'A single forward pass with an obvious "best next move" exists.',
      'You can argue no earlier choice needs to be revised.',
      'DP would work but is overkill - greedy gives the same answer faster.',
    ],
    whyItWorks:
      'When a local optimum is always part of some global optimum, one linear sweep suffices - no need to explore alternatives or memoise.',
    complexity: 'Usually O(n) or O(n log n) (if a sort is needed), O(1) space.',
    sketch: `reach = 0
for i in range(n):
    if i > reach: return False   # cannot get here
    reach = max(reach, i + a[i])
return True`,
    examples: [
      { problemId: 'jump-game', title: 'Jump Game', note: 'Track the furthest reachable index in one pass.' },
      { problemId: 'maximum-subarray', title: 'Maximum Subarray', note: "Kadane's: drop the running sum the moment it goes negative." },
    ],
  },
  {
    id: 'prefix-sums',
    name: 'Prefix Sums & Hashing',
    category: 'technique',
    oneLiner: 'Precompute running totals so any range answer is a single subtraction.',
    whatItIs:
      'Build an array where prefix[i] holds the aggregate of everything up to i. Any range sum is then prefix[r] − prefix[l]. Pairing prefix sums with a hash map of "sums seen so far" answers subarray-count questions in one pass.',
    whenToUse: [
      'Many range-sum / range-aggregate queries over a fixed array.',
      'Counting subarrays whose sum equals a target.',
      'You want to avoid an O(n) recompute for every range (O(n²) total).',
    ],
    whyItWorks:
      'One O(n) precompute turns every later range query into O(1). With a hash map of complements you count qualifying subarrays without nesting loops.',
    complexity: 'O(n) build + O(1) per query; O(n) space.',
    sketch: `seen = {0: 1}; running = 0; count = 0
for x in a:
    running += x
    count += seen.get(running - k, 0)
    seen[running] = seen.get(running, 0) + 1`,
    examples: [
      { problemId: 'subarray-sum-k', title: 'Subarray Sum Equals K', note: 'Hash map of prefix sums counts windows in O(n).' },
      { problemId: 'product-except-self', title: 'Product of Array Except Self', note: 'Prefix and suffix products instead of division.' },
    ],
  },
  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    category: 'technique',
    oneLiner: 'Use XOR, AND, OR and shifts to do arithmetic the array way.',
    whatItIs:
      'Treat numbers as bit vectors. XOR cancels equal pairs and is its own inverse; AND/OR/shifts let you test, set, or count bits. These tricks replace extra data structures with O(1) space.',
    whenToUse: [
      'Elements appear in pairs except one (XOR cancels the pairs).',
      'You need a set/flags over a small fixed universe (a bitmask).',
      'The expected solution is O(1) space and the naive one uses a hash set.',
    ],
    whyItWorks:
      'XOR of a value with itself is 0 and with 0 is itself, so paired values vanish and only the unique survivor remains - no counting structure required.',
    complexity: 'O(n) time, O(1) space.',
    sketch: `result = 0
for x in a:
    result ^= x   # pairs cancel, the lone value survives
return result`,
    examples: [
      { problemId: 'single-number', title: 'Single Number', note: 'XOR the whole array; duplicates cancel out.' },
      { problemId: 'missing-number', title: 'Missing Number', note: 'XOR indices against values to find the gap.' },
    ],
  },

  // ──────────────────────── Data structures (ADTs) ────────────────────────
  {
    id: 'hash-map-set',
    name: 'Hash Map & Set (the Map ADT)',
    category: 'structure',
    oneLiner: 'Trade memory for O(1) average lookups by key.',
    whatItIs:
      'The Map ADT stores key→value pairs; the Set ADT stores keys alone. A hash table implements both with average O(1) insert/lookup/delete by hashing the key into a bucket. (A tree-based map keeps keys sorted instead, at O(log n) - reach for that only when you need order.)',
    whenToUse: [
      'You repeatedly ask "have I seen this?" or "what maps to this key?".',
      'You need frequency counts, complements, or de-duplication.',
      'A nested loop is doing a linear search you could make O(1).',
    ],
    whyItWorks:
      'Hashing jumps straight to the bucket for a key, so a membership test that was an O(n) scan becomes O(1) on average - turning many O(n²) brute forces into O(n).',
    complexity: 'O(1) average per operation; O(n) space.',
    sketch: `seen = {}
for i, x in enumerate(a):
    if target - x in seen:
        return [seen[target - x], i]
    seen[x] = i`,
    examples: [
      { problemId: 'two-sum', title: 'Two Sum', note: 'Store complements; find the pair in one pass.' },
      { problemId: 'contains-duplicate', title: 'Contains Duplicate', note: 'A set answers "seen before?" instantly.' },
      { problemId: 'valid-anagram', title: 'Valid Anagram', note: 'Compare character-frequency maps.' },
      { problemId: 'top-k-frequent', title: 'Top K Frequent Elements', note: 'Count with a map, then pick the top k.' },
    ],
  },
  {
    id: 'stack',
    name: 'Stack',
    category: 'structure',
    oneLiner: 'Last-in, first-out - perfect for matching and "most recent" logic.',
    whatItIs:
      'A LIFO collection: push to the top, pop from the top, peek the top. A monotonic stack keeps its contents sorted so you can find the next greater/smaller element in one pass.',
    whenToUse: [
      'Brackets, nesting, or undo/most-recent semantics.',
      '"Next greater / smaller element" or histogram-style problems.',
      'You are parsing and need to defer work until a closing token.',
    ],
    whyItWorks:
      'Each element is pushed and popped at most once, so even though a monotonic stack looks like it could be quadratic, the total work is O(n).',
    complexity: 'O(1) per push/pop; O(n) total, O(n) space.',
    sketch: `stack = []
for token in tokens:
    if opens(token): stack.append(token)
    elif not stack or not matches(stack.pop(), token):
        return False
return not stack`,
    examples: [
      { problemId: 'valid-parentheses', title: 'Valid Parentheses', note: 'Push openers, pop on matching closers.' },
      { problemId: 'largest-rectangle-histogram', title: 'Largest Rectangle in Histogram', note: 'Monotonic stack of increasing bar heights.' },
    ],
  },
  {
    id: 'queue-deque',
    name: 'Queue & Deque',
    category: 'structure',
    oneLiner: 'First-in, first-out - process things in arrival order.',
    whatItIs:
      'A queue serves elements in the order they arrived (FIFO) and powers breadth-first search. A deque (double-ended queue) lets you push and pop from both ends in O(1), which makes it the engine behind sliding-window extremes.',
    whenToUse: [
      'BFS / level-order traversal where order of discovery matters.',
      'You need the max/min of a moving window in O(1) amortised.',
      'A scheduling / streaming problem with "process in order" semantics.',
    ],
    whyItWorks:
      'O(1) operations at both ends mean a monotonic deque can drop dominated elements as it goes, giving each element one push and one pop - O(n) overall for a windowed extreme.',
    complexity: 'O(1) per push/pop at either end; O(n) total.',
    sketch: `dq = deque()        # holds indices, values decreasing
for i, x in enumerate(a):
    while dq and a[dq[-1]] <= x: dq.pop()
    dq.append(i)
    if dq[0] <= i - k: dq.popleft()
    if i >= k - 1: out.append(a[dq[0]])`,
    examples: [
      { problemId: 'sliding-window-maximum', title: 'Sliding Window Maximum', note: 'Monotonic deque yields each window max in O(1).' },
      { problemId: 'number-of-islands', title: 'Number of Islands', note: 'Swap the DFS stack for a queue to flood with BFS.' },
    ],
  },
  {
    id: 'priority-queue',
    name: 'Priority Queue (Heap)',
    category: 'structure',
    oneLiner: 'Always pull out the current best element in O(log n).',
    whatItIs:
      'A priority queue serves elements by priority rather than arrival order. A binary heap implements it: O(log n) insert and O(log n) pop-min/max, with O(1) peek at the best. Keep a heap of size k to track the top-k cheaply.',
    whenToUse: [
      '"Top k", "k closest", "k largest", or a running median.',
      'You repeatedly need the current min/max while inserting more.',
      'Merging sorted streams, or Dijkstra-style "expand the cheapest next".',
    ],
    whyItWorks:
      'A size-k heap gives O(n log k) for a top-k query - far better than the O(n log n) of sorting everything when k is small.',
    complexity: 'O(log n) push/pop, O(1) peek; top-k in O(n log k).',
    sketch: `heap = []                     # min-heap of size k
for x in a:
    heappush(heap, x)
    if len(heap) > k: heappop(heap)
return heap                    # the k largest`,
    examples: [
      { problemId: 'top-k-frequent', title: 'Top K Frequent Elements', note: 'Count, then keep a size-k heap of frequencies.' },
    ],
  },
  {
    id: 'Big-Oh Complexity',
    name: 'Big-Oh Complexity',
    category: 'theory',
    oneLiner: 'Terminology for how an algorithm scales with input size.',
    whatItIs: 'Big-O is a term used that belongs to a family of terms that classify how runtimes scale with input size. Let f(n) and g(n) be two functions defined on a set of positive integers. We say that f(n) is O(g(n)) if there exist positive constants c and n₀ such that: f(n) <= cg(n) , c>0, ∀n > n0 where n0 >= 0',
    whenToUse: ['To describe behaviour of how an algorithm scales with input size'],
    whyItWorks: 'All algorithms have a spatial complexity and a time complexity, so this enables comparisons of different algorithms given the same input',
    complexity: 'O(1) - Constant time, O(log n) - Logarithmic time, O(n) - Linear time, O(n log n) - Log Linear time, O(n^2) - Quadratic time, O(2^n) - Exponential time, O(n!) - Factorial time',
    sketch: `O(1) - Constant time \nO(log n) - Logarithmic time\nO(n) - Linear time\nO(n log n) - Log Linear time\nO(n^2) - Quadratic time\nO(2^n) - Exponential time\nO(n!) - Factorial time`,
    examples: [{problemId: 'top-k-frequent', title: 'Top K Frequent Elements', note: 'Count, then keep a size-k heap of frequencies.'}
    ],
  },
      
];

/** Stable ordering for the two on-page groups. */
export const TECHNIQUES = PATTERNS.filter((p) => p.category === 'technique');
export const STRUCTURES = PATTERNS.filter((p) => p.category === 'structure');
export const THEORY = PATTERNS.filter((p) => p.category === 'theory');
