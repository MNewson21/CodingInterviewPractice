import type { Monaco } from '@monaco-editor/react';
import type { languages, editor, Position } from 'monaco-editor';

/**
 * Curated autocomplete for Python / Java / C++.
 * 
 * I wanted this since I feel like a lot of editors miss some features. However
 * TS and JS both had this already
 * BUt I feel as if I have it for python and java and c++ it will make it a lot easier to put your ideas into actual code
 * And it feels nice to type with autocompletion, and it can be a pain to have to look up the syntax for certain things all the time, so this should help with that
 * This is also easy to extend too.
 *
 * Monaco only ships a real language service for JS/TS, so other languages get
 * nothing library-aware out of the box. These providers add hand-picked
 * keywords, common stdlib calls + methods, and snippets so typing one letter
 * surfaces useful suggestions. Each function/method carries a `detail`
 * (its signature + return type, shown inline) and `doc` (a short description
 * shown in the expandable panel) - so you can see what a call returns without
 * leaving the editor. This is not full type-aware IntelliSense (it can't know a
 * given variable's type), but it covers the high-value 90% and makes it way easier to write imo.
 */

type Kind = 'keyword' | 'function' | 'method' | 'snippet' | 'class';

type Entry = {
  label: string;
  /** Defaults to `label`. Use snippet syntax (`${1:x}`, `$0`) for placeholders. */
  insert?: string;
  kind: Kind;
  /** Inline hint, e.g. a signature with return type: `len(obj) -> int`. */
  detail?: string;
  /** Markdown shown in the expandable side panel (description + return). */
  doc?: string;
  /** Treat insert text as a snippet (placeholders/tab stops). */
  snippet?: boolean;
};

const k = (label: string, detail?: string): Entry => ({ label, kind: 'keyword', detail });
const cls = (label: string, detail?: string): Entry => ({ label, kind: 'class', detail });
const fn = (label: string, insert: string, detail?: string, doc?: string): Entry => ({ label, insert, kind: 'function', detail, doc, snippet: true });
const m = (label: string, insert: string, detail?: string, doc?: string): Entry => ({ label, insert, kind: 'method', detail, doc, snippet: true });
const snip = (label: string, insert: string, detail: string, doc?: string): Entry => ({ label, insert, kind: 'snippet', detail, doc, snippet: true });

const PYTHON: Entry[] = [
  // keywords
  k('def'), k('return'), k('if'), k('elif'), k('else'), k('for'), k('while'), k('in'),
  k('not'), k('and'), k('or'), k('True'), k('False'), k('None'), k('import'), k('from'),
  k('class'), k('try'), k('except'), k('finally'), k('with'), k('as'), k('lambda'),
  k('pass'), k('break'), k('continue'), k('yield'), k('global'), k('nonlocal'), k('assert'),
  k('raise'), k('del'), k('is'),
  // builtins (signature → return)
  fn('print', 'print(${1})', 'print(*values, sep=" ", end="\\n") → None', 'Write values to stdout.'),
  fn('len', 'len(${1})', 'len(obj) → int', 'Number of items in a sequence or collection.'),
  fn('range', 'range(${1})', 'range(stop) / range(start, stop[, step]) → range', 'Immutable sequence of integers.'),
  fn('enumerate', 'enumerate(${1})', 'enumerate(iterable, start=0) → iterator of (int, T)', 'Yields (index, value) pairs.'),
  fn('zip', 'zip(${1})', 'zip(*iterables) → iterator of tuples', 'Aggregates elements from each iterable.'),
  fn('map', 'map(${1:fn}, ${2:iterable})', 'map(fn, iterable) → map', 'Lazily applies fn to every item.'),
  fn('filter', 'filter(${1:fn}, ${2:iterable})', 'filter(fn, iterable) → filter', 'Keeps items where fn(item) is truthy.'),
  fn('sorted', 'sorted(${1})', 'sorted(iterable, key=None, reverse=False) → list', 'New sorted list.'),
  fn('reversed', 'reversed(${1})', 'reversed(seq) → iterator', 'Reverse iterator over a sequence.'),
  fn('sum', 'sum(${1})', 'sum(iterable, start=0) → number', 'Sum of items.'),
  fn('min', 'min(${1})', 'min(iterable) / min(a, b, …) → T', 'Smallest item.'),
  fn('max', 'max(${1})', 'max(iterable) / max(a, b, …) → T', 'Largest item.'),
  fn('abs', 'abs(${1})', 'abs(x) → number', 'Absolute value.'),
  fn('int', 'int(${1})', 'int(x, base=10) → int', 'Convert to integer.'),
  fn('str', 'str(${1})', 'str(x) → str', 'Convert to string.'),
  fn('float', 'float(${1})', 'float(x) → float', 'Convert to float.'),
  fn('list', 'list(${1})', 'list(iterable) → list', 'New list from an iterable.'),
  fn('dict', 'dict(${1})', 'dict(...) → dict', 'New dictionary.'),
  fn('set', 'set(${1})', 'set(iterable) → set', 'New set (unique items).'),
  fn('tuple', 'tuple(${1})', 'tuple(iterable) → tuple', 'New immutable tuple.'),
  fn('input', 'input(${1})', 'input(prompt="") → str', 'Read one line from stdin.'),
  fn('isinstance', 'isinstance(${1:obj}, ${2:type})', 'isinstance(obj, type) → bool', 'Type membership test.'),
  fn('type', 'type(${1})', 'type(obj) → type', "Object's type."),
  fn('any', 'any(${1})', 'any(iterable) → bool', 'True if any item is truthy.'),
  fn('all', 'all(${1})', 'all(iterable) → bool', 'True if every item is truthy.'),
  fn('round', 'round(${1})', 'round(x, ndigits=None) → number', 'Round to ndigits.'),
  fn('ord', 'ord(${1})', 'ord(c) → int', 'Unicode code point of a character.'),
  fn('chr', 'chr(${1})', 'chr(i) → str', 'Character for a code point.'),
  fn('divmod', 'divmod(${1:a}, ${2:b})', 'divmod(a, b) → (quotient, remainder)', 'Floor division and modulo together.'),
  fn('pow', 'pow(${1:base}, ${2:exp})', 'pow(base, exp, mod=None) → number', 'base ** exp (optionally mod).'),
  // str methods
  m('split', 'split(${1})', 'str.split(sep=None) → list[str]', 'Split a string into a list.'),
  m('strip', 'strip(${1})', 'str.strip(chars=None) → str', 'Trim leading/trailing whitespace.'),
  m('join', 'join(${1:iterable})', 'str.join(iterable) → str', 'Concatenate items with this string as separator.'),
  m('replace', 'replace(${1:old}, ${2:new})', 'str.replace(old, new) → str', 'String with replacements.'),
  m('upper', 'upper()', 'str.upper() → str', 'Uppercased copy.'),
  m('lower', 'lower()', 'str.lower() → str', 'Lowercased copy.'),
  m('find', 'find(${1:sub})', 'str.find(sub) → int', 'Lowest index of sub, or -1.'),
  m('startswith', 'startswith(${1:prefix})', 'str.startswith(prefix) → bool', 'Prefix test.'),
  m('endswith', 'endswith(${1:suffix})', 'str.endswith(suffix) → bool', 'Suffix test.'),
  m('isdigit', 'isdigit()', 'str.isdigit() → bool', 'True if all chars are digits.'),
  // list / dict methods
  m('append', 'append(${1})', 'list.append(x) → None', 'Add an item to the end (in place).'),
  m('pop', 'pop(${1})', 'list.pop(i=-1) → T', 'Remove and return item at index.'),
  m('sort', 'sort()', 'list.sort(key=None, reverse=False) → None', 'Sort in place.'),
  m('index', 'index(${1})', 'list.index(x) → int', 'First index of x.'),
  m('count', 'count(${1})', 'list/str.count(x) → int', 'Number of occurrences.'),
  m('insert', 'insert(${1:i}, ${2:x})', 'list.insert(i, x) → None', 'Insert x before index i.'),
  m('get', 'get(${1:key})', 'dict.get(key, default=None) → V', 'Value for key, or default.'),
  m('items', 'items()', 'dict.items() → view of (K, V)', 'Iterable of key/value pairs.'),
  m('keys', 'keys()', 'dict.keys() → view of K', 'Iterable of keys.'),
  m('values', 'values()', 'dict.values() → view of V', 'Iterable of values.'),
  // heapq (priority queue) - call as heapq.<fn>(heap, …); heap is a plain list
  m('heappush', 'heappush(${1:heap}, ${2:item})', 'heapq.heappush(heap, item) → None', 'Push onto a min-heap.'),
  m('heappop', 'heappop(${1:heap})', 'heapq.heappop(heap) → item', 'Pop and return the smallest item.'),
  m('heapify', 'heapify(${1:list})', 'heapq.heapify(list) → None', 'Rearrange a list into a heap in place.'),
  // str char-classification (used by the string/counting problems)
  m('islower', 'islower()', 'str.islower() → bool', 'True if all cased chars are lowercase.'),
  m('isupper', 'isupper()', 'str.isupper() → bool', 'True if all cased chars are uppercase.'),
  m('isalpha', 'isalpha()', 'str.isalpha() → bool', 'True if every char is a letter.'),
  m('isalnum', 'isalnum()', 'str.isalnum() → bool', 'True if every char is a letter or digit.'),
  m('isspace', 'isspace()', 'str.isspace() → bool', 'True if every char is whitespace.'),
  m('capitalize', 'capitalize()', 'str.capitalize() → str', 'First char upper, rest lower.'),
  m('title', 'title()', 'str.title() → str', 'Title-case each word.'),
  m('swapcase', 'swapcase()', 'str.swapcase() → str', 'Swap the case of every letter.'),
  m('zfill', 'zfill(${1:width})', 'str.zfill(width) → str', 'Left-pad with zeros to width.'),
  m('rfind', 'rfind(${1:sub})', 'str.rfind(sub) → int', 'Highest index of sub, or -1.'),
  m('lstrip', 'lstrip(${1})', 'str.lstrip(chars=None) → str', 'Trim from the left.'),
  m('rstrip', 'rstrip(${1})', 'str.rstrip(chars=None) → str', 'Trim from the right.'),
  // set / list / dict mutation
  m('add', 'add(${1})', 'set.add(x) → None', 'Insert into a set.'),
  m('discard', 'discard(${1})', 'set.discard(x) → None', 'Remove if present (no error if absent).'),
  m('remove', 'remove(${1})', 'list/set.remove(x) → None', 'Remove the first matching item.'),
  m('extend', 'extend(${1:iterable})', 'list.extend(iterable) → None', 'Append all items from an iterable.'),
  m('clear', 'clear()', 'list/dict/set.clear() → None', 'Remove all items.'),
  m('setdefault', 'setdefault(${1:key}, ${2:default})', 'dict.setdefault(key, default) → V', 'Get key, inserting default if absent.'),
  m('update', 'update(${1})', 'dict/set.update(other) → None', 'Merge in another dict/iterable.'),
  // snippets
  snip('for', 'for ${1:item} in ${2:iterable}:\n    ${0:pass}', 'for loop'),
  // data structures
  snip('dictt', '${1:d} = {}', 'new dict (hashmap)', 'Key → value mapping.'),
  snip('listt', '${1:lst} = []', 'new list'),
  snip('sett', '${1:s} = set()', 'new set', 'Unique elements.'),
  snip('deque', 'from collections import deque\n${1:dq} = deque()', 'deque (stack/queue)', 'append/appendleft/pop/popleft, O(1) both ends.'),
  snip('defaultdict', 'from collections import defaultdict\n${1:d} = defaultdict(${2:int})', 'defaultdict', 'Auto-creates missing values (int/list/set).'),
  snip('counter', 'from collections import Counter\n${1:c} = Counter(${2:iterable})', 'Counter (multiset)', 'Counts occurrences; .most_common(n).'),
  snip('heap', 'import heapq\n${1:heap} = []\nheapq.heappush(${1:heap}, ${2:item})', 'min-heap via heapq', 'A list managed by heapq as a priority queue.'),
  snip('fori', 'for ${1:i} in range(${2:n}):\n    ${0:pass}', 'indexed for loop'),
  snip('ifmain', 'if __name__ == "__main__":\n    ${0:main()}', 'main guard'),
  snip('deff', 'def ${1:name}(${2:args}):\n    ${0:pass}', 'function def'),
  snip('classc', 'class ${1:Name}:\n    def __init__(self${2:, args}):\n        ${0:pass}', 'class def'),
  snip('tryx', 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${0:pass}', 'try/except'),
  snip('lc', '[${1:x} for ${2:x} in ${3:iterable}]', 'list comprehension'),
];

const JAVA: Entry[] = [
  // keywords
  k('public'), k('private'), k('protected'), k('class'), k('static'), k('void'), k('int'),
  k('long'), k('double'), k('boolean'), k('char'), k('return'), k('if'), k('else'), k('for'),
  k('while'), k('new'), k('final'), k('this'), k('null'), k('true'), k('false'), k('import'),
  k('package'), k('try'), k('catch'), k('finally'), k('throw'), k('throws'), k('extends'),
  k('implements'), k('interface'), k('abstract'), k('switch'), k('case'), k('break'), k('continue'),
  k('instanceof'), k('default'),
  // classes
  cls('String'), cls('Integer'), cls('Double'), cls('Boolean'), cls('Math'), cls('Arrays'),
  cls('Collections'), cls('List'), cls('ArrayList'), cls('Map'), cls('HashMap'), cls('Set'),
  cls('HashSet'), cls('StringBuilder'), cls('Deque'), cls('ArrayDeque'), cls('Queue'),
  cls('PriorityQueue'), cls('Stack'),
  // static calls (signature → return)
  fn('System.out.println', 'System.out.println(${1});', 'System.out.println(x) → void', 'Print x followed by a newline.'),
  fn('System.out.print', 'System.out.print(${1});', 'System.out.print(x) → void', 'Print x without a newline.'),
  fn('System.out.printf', 'System.out.printf(${1:"%d"}, ${2});', 'System.out.printf(fmt, args…) → void', 'Formatted print.'),
  fn('Integer.parseInt', 'Integer.parseInt(${1})', 'Integer.parseInt(s) → int', 'Parse a string to an int.'),
  fn('Double.parseDouble', 'Double.parseDouble(${1})', 'Double.parseDouble(s) → double', 'Parse a string to a double.'),
  fn('String.valueOf', 'String.valueOf(${1})', 'String.valueOf(x) → String', 'Convert any value to a String.'),
  fn('Math.max', 'Math.max(${1:a}, ${2:b})', 'Math.max(a, b) → int | double', 'Larger of two numbers.'),
  fn('Math.min', 'Math.min(${1:a}, ${2:b})', 'Math.min(a, b) → int | double', 'Smaller of two numbers.'),
  fn('Math.abs', 'Math.abs(${1})', 'Math.abs(x) → int | double', 'Absolute value.'),
  fn('Math.pow', 'Math.pow(${1:a}, ${2:b})', 'Math.pow(a, b) → double', 'a raised to the power b.'),
  fn('Math.sqrt', 'Math.sqrt(${1})', 'Math.sqrt(x) → double', 'Square root.'),
  fn('Arrays.sort', 'Arrays.sort(${1})', 'Arrays.sort(arr) → void', 'Sort an array in place.'),
  fn('Arrays.toString', 'Arrays.toString(${1})', 'Arrays.toString(arr) → String', 'Readable array representation.'),
  fn('Arrays.fill', 'Arrays.fill(${1:arr}, ${2:val})', 'Arrays.fill(arr, val) → void', 'Fill every slot with val.'),
  fn('Collections.sort', 'Collections.sort(${1})', 'Collections.sort(list) → void', 'Sort a List in place.'),
  // methods (signature → return)
  m('length', 'length()', 'String.length() → int', 'Number of characters.'),
  m('charAt', 'charAt(${1:i})', 'String.charAt(i) → char', 'Character at index i.'),
  m('substring', 'substring(${1:begin}, ${2:end})', 'String.substring(begin, end) → String', 'Substring [begin, end).'),
  m('indexOf', 'indexOf(${1})', 'String.indexOf(s) → int', 'Index of first match, or -1.'),
  m('split', 'split(${1:regex})', 'String.split(regex) → String[]', 'Split by a regex.'),
  m('toCharArray', 'toCharArray()', 'String.toCharArray() → char[]', "The string's characters."),
  m('equals', 'equals(${1})', 'Object.equals(o) → boolean', 'Value equality.'),
  m('contains', 'contains(${1})', 'String/Collection.contains(x) → boolean', 'Membership test.'),
  m('toLowerCase', 'toLowerCase()', 'String.toLowerCase() → String', 'Lowercased copy.'),
  m('toUpperCase', 'toUpperCase()', 'String.toUpperCase() → String', 'Uppercased copy.'),
  m('trim', 'trim()', 'String.trim() → String', 'Trim surrounding whitespace.'),
  m('add', 'add(${1})', 'List/Set.add(x) → boolean', 'Append/insert an element.'),
  m('get', 'get(${1})', 'List.get(i) / Map.get(k) → E | V', 'Element at index, or value for key.'),
  m('size', 'size()', 'Collection.size() → int', 'Number of elements.'),
  m('put', 'put(${1:key}, ${2:value})', 'Map.put(k, v) → V', 'Associate key with value; returns previous.'),
  m('containsKey', 'containsKey(${1})', 'Map.containsKey(k) → boolean', 'Key membership test.'),
  m('getOrDefault', 'getOrDefault(${1:key}, ${2:def})', 'Map.getOrDefault(k, def) → V', 'Value for key, or def.'),
  m('isEmpty', 'isEmpty()', 'Collection/String.isEmpty() → boolean', 'True if empty.'),
  m('append', 'append(${1})', 'StringBuilder.append(x) → StringBuilder', 'Append (chainable).'),
  // ADT methods - Stack / Queue / Deque / PriorityQueue
  m('push', 'push(${1})', 'Stack/Deque.push(x) → void | E', 'Push onto the stack (top).'),
  m('pop', 'pop()', 'Stack/Deque.pop() → E', 'Remove and return the top.'),
  m('peek', 'peek()', 'Stack/Queue/Deque/PriorityQueue.peek() → E', 'Look at the head/top without removing.'),
  m('poll', 'poll()', 'Queue/Deque/PriorityQueue.poll() → E', 'Remove and return the head, or null if empty.'),
  m('offer', 'offer(${1})', 'Queue/Deque/PriorityQueue.offer(x) → boolean', 'Add an element to the queue/heap.'),
  m('remove', 'remove(${1})', 'Collection.remove(x) / Map.remove(k) → boolean | V', 'Remove an element or key.'),
  m('keySet', 'keySet()', 'Map.keySet() → Set<K>', 'Set of keys.'),
  m('values', 'values()', 'Map.values() → Collection<V>', 'Collection of values.'),
  m('entrySet', 'entrySet()', 'Map.entrySet() → Set<Map.Entry<K,V>>', 'Key/value entries (use .getKey()/.getValue()).'),
  // Character classification (static - type the name and pick the full call)
  fn('Character.isLetter', 'Character.isLetter(${1:c})', 'Character.isLetter(c) → boolean', 'True if c is a letter.'),
  fn('Character.isDigit', 'Character.isDigit(${1:c})', 'Character.isDigit(c) → boolean', 'True if c is a digit.'),
  fn('Character.isLetterOrDigit', 'Character.isLetterOrDigit(${1:c})', 'Character.isLetterOrDigit(c) → boolean', 'Letter or digit.'),
  fn('Character.isLowerCase', 'Character.isLowerCase(${1:c})', 'Character.isLowerCase(c) → boolean', 'True if c is lowercase.'),
  fn('Character.isUpperCase', 'Character.isUpperCase(${1:c})', 'Character.isUpperCase(c) → boolean', 'True if c is uppercase.'),
  fn('Character.isWhitespace', 'Character.isWhitespace(${1:c})', 'Character.isWhitespace(c) → boolean', 'True if c is whitespace.'),
  fn('Character.toLowerCase', 'Character.toLowerCase(${1:c})', 'Character.toLowerCase(c) → char', 'Lowercased char.'),
  fn('Character.toUpperCase', 'Character.toUpperCase(${1:c})', 'Character.toUpperCase(c) → char', 'Uppercased char.'),
  fn('Character.getNumericValue', 'Character.getNumericValue(${1:c})', 'Character.getNumericValue(c) → int', "Digit value of c ('7' → 7)."),
  fn('Math.floor', 'Math.floor(${1})', 'Math.floor(x) → double', 'Round down.'),
  fn('Math.ceil', 'Math.ceil(${1})', 'Math.ceil(x) → double', 'Round up.'),
  fn('Math.round', 'Math.round(${1})', 'Math.round(x) → long | int', 'Round to the nearest integer.'),
  cls('Integer.MAX_VALUE', 'Integer.MAX_VALUE → int (2^31 − 1)'),
  cls('Integer.MIN_VALUE', 'Integer.MIN_VALUE → int (−2^31)'),
  // more String methods
  m('startsWith', 'startsWith(${1:prefix})', 'String.startsWith(prefix) → boolean', 'Prefix test.'),
  m('endsWith', 'endsWith(${1:suffix})', 'String.endsWith(suffix) → boolean', 'Suffix test.'),
  m('replace', 'replace(${1:a}, ${2:b})', 'String.replace(a, b) → String', 'Replace chars or sequences.'),
  m('compareTo', 'compareTo(${1})', 'String.compareTo(o) → int', 'Lexicographic comparison.'),
  m('repeat', 'repeat(${1:n})', 'String.repeat(n) → String', 'Repeat the string n times.'),
  // snippets
  snip('sout', 'System.out.println(${1});', 'print line'),
  // data-structure declarations (with generics)
  snip('Stack<>', 'Stack<${1:Integer}> ${2:stack} = new Stack<>();', 'new Stack<>()', 'LIFO stack.'),
  snip('ArrayList<>', 'List<${1:Integer}> ${2:list} = new ArrayList<>();', 'new ArrayList<>()', 'Resizable list.'),
  snip('HashMap<>', 'Map<${1:Integer}, ${2:Integer}> ${3:map} = new HashMap<>();', 'new HashMap<>()', 'Key → value dictionary.'),
  snip('HashSet<>', 'Set<${1:Integer}> ${2:set} = new HashSet<>();', 'new HashSet<>()', 'Unique elements.'),
  snip('ArrayDeque<>', 'Deque<${1:Integer}> ${2:deque} = new ArrayDeque<>();', 'new ArrayDeque<>()', 'Double-ended queue - use as a stack or queue.'),
  snip('PriorityQueue<>', 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();', 'min-heap (default)', 'Smallest element first.'),
  snip('PriorityQueue<> max', 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>(Collections.reverseOrder());', 'max-heap', 'Largest element first.'),
  snip('Queue<>', 'Queue<${1:Integer}> ${2:queue} = new LinkedList<>();', 'new LinkedList<>() as a Queue', 'FIFO queue.'),
  snip('fori', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${0}\n}', 'indexed for loop'),
  snip('foreach', 'for (${1:Type} ${2:item} : ${3:collection}) {\n    ${0}\n}', 'enhanced for loop'),
  snip('ifx', 'if (${1:condition}) {\n    ${0}\n}', 'if block'),
  snip('ifelse', 'if (${1:condition}) {\n    ${2}\n} else {\n    ${0}\n}', 'if/else'),
  snip('whilex', 'while (${1:condition}) {\n    ${0}\n}', 'while loop'),
  snip('psvm', 'public static void main(String[] args) {\n    ${0}\n}', 'main method'),
  snip('classc', 'class ${1:Name} {\n    ${0}\n}', 'class def'),
];

const CPP: Entry[] = [
  // keywords
  k('int'), k('long'), k('double'), k('float'), k('char'), k('bool'), k('void'), k('return'),
  k('if'), k('else'), k('for'), k('while'), k('auto'), k('const'), k('struct'), k('class'),
  k('public'), k('private'), k('namespace'), k('using'), k('template'), k('typename'), k('true'),
  k('false'), k('nullptr'), k('new'), k('delete'), k('switch'), k('case'), k('break'),
  k('continue'), k('sizeof'), k('static'), k('unsigned'), k('size_t'),
  // classes / containers
  cls('vector'), cls('string'), cls('pair'), cls('map'), cls('unordered_map'), cls('set'),
  cls('unordered_set'), cls('stack'), cls('queue'), cls('priority_queue'), cls('deque'),
  // free functions (signature → return)
  fn('cout', 'cout << ${1} << endl;', 'cout << x → ostream&', 'Write to stdout (chainable).'),
  fn('cin', 'cin >> ${1};', 'cin >> x → istream&', 'Read from stdin (chainable).'),
  fn('sort', 'sort(${1:v}.begin(), ${1:v}.end())', 'sort(first, last) → void', 'Sort a range in place.'),
  fn('reverse', 'reverse(${1:v}.begin(), ${1:v}.end())', 'reverse(first, last) → void', 'Reverse a range in place.'),
  fn('max', 'max(${1:a}, ${2:b})', 'max(a, b) → T', 'Larger of two values.'),
  fn('min', 'min(${1:a}, ${2:b})', 'min(a, b) → T', 'Smaller of two values.'),
  fn('max_element', 'max_element(${1:v}.begin(), ${1:v}.end())', 'max_element(first, last) → iterator', 'Iterator to the largest element.'),
  fn('min_element', 'min_element(${1:v}.begin(), ${1:v}.end())', 'min_element(first, last) → iterator', 'Iterator to the smallest element.'),
  fn('accumulate', 'accumulate(${1:v}.begin(), ${2:v}.end(), ${3:0})', 'accumulate(first, last, init) → T', 'Sum (or fold) of a range. Needs <numeric>.'),
  fn('to_string', 'to_string(${1})', 'to_string(n) → string', 'Number to string.'),
  fn('stoi', 'stoi(${1})', 'stoi(s) → int', 'String to int.'),
  fn('stol', 'stol(${1})', 'stol(s) → long', 'String to long.'),
  fn('stod', 'stod(${1})', 'stod(s) → double', 'String to double.'),
  fn('abs', 'abs(${1})', 'abs(x) → int | double', 'Absolute value.'),
  fn('swap', 'swap(${1:a}, ${2:b})', 'swap(a, b) → void', 'Exchange two values.'),
  // methods (signature → return)
  m('push_back', 'push_back(${1})', 'vector/string.push_back(x) → void', 'Append an element.'),
  m('pop_back', 'pop_back()', 'vector/string.pop_back() → void', 'Remove the last element.'),
  m('size', 'size()', 'container.size() → size_t', 'Number of elements.'),
  m('empty', 'empty()', 'container.empty() → bool', 'True if size is 0.'),
  m('back', 'back()', 'vector/string.back() → T&', 'Reference to the last element.'),
  m('front', 'front()', 'container.front() → T&', 'Reference to the first element.'),
  m('begin', 'begin()', 'container.begin() → iterator', 'Iterator to the first element.'),
  m('end', 'end()', 'container.end() → iterator', 'Iterator past the last element.'),
  m('at', 'at(${1:i})', 'container.at(i) → T&', 'Bounds-checked element access.'),
  m('clear', 'clear()', 'container.clear() → void', 'Remove all elements.'),
  m('count', 'count(${1:key})', 'map/set.count(key) → size_t', '1 if present, else 0.'),
  m('find', 'find(${1:key})', 'map/set/string.find(x) → iterator | size_t', 'Locate an element.'),
  m('insert', 'insert(${1})', 'container.insert(x) → ...', 'Insert an element.'),
  m('substr', 'substr(${1:pos}, ${2:len})', 'string.substr(pos, len) → string', 'Substring starting at pos.'),
  m('length', 'length()', 'string.length() → size_t', 'Number of characters.'),
  m('top', 'top()', 'stack/priority_queue.top() → T&', 'The top element (largest for a default priority_queue).'),
  m('push', 'push(${1})', 'stack/queue/priority_queue.push(x) → void', 'Add an element.'),
  m('pop', 'pop()', 'stack/queue/priority_queue.pop() → void', 'Remove the next element (does not return it).'),
  m('emplace', 'emplace(${1})', 'container.emplace(args…) → ...', 'Construct an element in place.'),
  m('erase', 'erase(${1})', 'container.erase(pos|key) → ...', 'Remove element(s) by position or key.'),
  m('lower_bound', 'lower_bound(${1:key})', 'set/map.lower_bound(key) → iterator', 'First element ≥ key.'),
  m('upper_bound', 'upper_bound(${1:key})', 'set/map.upper_bound(key) → iterator', 'First element > key.'),
  m('first', 'first', 'pair.first → T', 'First element of a pair.'),
  m('second', 'second', 'pair.second → U', 'Second element of a pair.'),
  // <cctype> char classification + <cmath> helpers (free functions - call as fn(c))
  fn('islower', 'islower(${1:c})', 'islower(c) → int (nonzero = true)', 'True if c is lowercase. <cctype>'),
  fn('isupper', 'isupper(${1:c})', 'isupper(c) → int', 'True if c is uppercase. <cctype>'),
  fn('isalpha', 'isalpha(${1:c})', 'isalpha(c) → int', 'True if c is a letter. <cctype>'),
  fn('isdigit', 'isdigit(${1:c})', 'isdigit(c) → int', 'True if c is a digit. <cctype>'),
  fn('isalnum', 'isalnum(${1:c})', 'isalnum(c) → int', 'Letter or digit. <cctype>'),
  fn('isspace', 'isspace(${1:c})', 'isspace(c) → int', 'True if c is whitespace. <cctype>'),
  fn('tolower', 'tolower(${1:c})', 'tolower(c) → int', 'Lowercased char. <cctype>'),
  fn('toupper', 'toupper(${1:c})', 'toupper(c) → int', 'Uppercased char. <cctype>'),
  fn('sqrt', 'sqrt(${1})', 'sqrt(x) → double', 'Square root. <cmath>'),
  fn('pow', 'pow(${1:a}, ${2:b})', 'pow(a, b) → double', 'a raised to the power b. <cmath>'),
  fn('floor', 'floor(${1})', 'floor(x) → double', 'Round down. <cmath>'),
  fn('ceil', 'ceil(${1})', 'ceil(x) → double', 'Round up. <cmath>'),
  fn('gcd', 'gcd(${1:a}, ${2:b})', 'gcd(a, b) → T (C++17, <numeric>)', 'Greatest common divisor.'),
  cls('INT_MAX', 'INT_MAX → largest int (<climits>)'),
  cls('INT_MIN', 'INT_MIN → smallest int (<climits>)'),
  // snippets
  snip('fori', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${0}\n}', 'indexed for loop'),
  // data-structure declarations (with generics)
  snip('stack<>', 'stack<${1:int}> ${2:st};', 'LIFO stack', 'top()/push()/pop()/empty().'),
  snip('queue<>', 'queue<${1:int}> ${2:q};', 'FIFO queue', 'front()/push()/pop()/empty().'),
  snip('priority_queue<>', 'priority_queue<${1:int}> ${2:pq};', 'max-heap (default)', 'top() is the largest.'),
  snip('priority_queue<> min', 'priority_queue<${1:int}, vector<${1:int}>, greater<${1:int}>> ${2:pq};', 'min-heap', 'top() is the smallest.'),
  snip('map<>', 'map<${1:int}, ${2:int}> ${3:m};', 'ordered map', 'Sorted by key (tree).'),
  snip('unordered_map<>', 'unordered_map<${1:int}, ${2:int}> ${3:m};', 'hash map', 'Average O(1) lookup.'),
  snip('set<>', 'set<${1:int}> ${2:s};', 'ordered set', 'Unique, sorted.'),
  snip('unordered_set<>', 'unordered_set<${1:int}> ${2:s};', 'hash set', 'Unique, average O(1).'),
  snip('pair<>', 'pair<${1:int}, ${2:int}> ${3:p};', 'declare pair', 'Access with .first / .second.'),
  snip('grid<>', 'vector<vector<${1:int}>> ${2:grid};', '2D vector', 'Matrix / grid.'),
  snip('foreach', 'for (auto& ${1:x} : ${2:container}) {\n    ${0}\n}', 'range-based for loop'),
  snip('ifx', 'if (${1:condition}) {\n    ${0}\n}', 'if block'),
  snip('whilex', 'while (${1:condition}) {\n    ${0}\n}', 'while loop'),
  snip('vec', 'vector<${1:int}> ${2:v};', 'declare vector'),
  snip('coutx', 'cout << ${1} << "\\n";', 'print'),
  snip('mainc', 'int main() {\n    ${0}\n    return 0;\n}', 'main function'),
  snip('include', '#include <${1:iostream}>', 'include header'),
];

const TABLE: Record<string, Entry[]> = { python: PYTHON, java: JAVA, cpp: CPP };

let registered = false;

/** Register curated completion providers once per Monaco instance. */
export function registerCompletions(monaco: Monaco): void {
  if (registered) return;
  registered = true;

  const KIND = monaco.languages.CompletionItemKind;
  const kindMap: Record<Kind, languages.CompletionItemKind> = {
    keyword: KIND.Keyword,
    function: KIND.Function,
    method: KIND.Method,
    snippet: KIND.Snippet,
    class: KIND.Class,
  };

  for (const [lang, entries] of Object.entries(TABLE)) {
    monaco.languages.registerCompletionItemProvider(lang, {
      // Open the popup after a dot too, not just while typing a word.
      triggerCharacters: ['.'],
      provideCompletionItems(model: editor.ITextModel, position: Position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        // Member access: if the character before the current word is '.', we're
        // after a dot (e.g. `st.`). Without a type server we can't know st's type,
        // so show every known method; otherwise show the non-method entries
        // (keywords / functions / classes / snippets) to keep the list relevant.
        const line = model.getLineContent(position.lineNumber);
        const afterDot = line[word.startColumn - 2] === '.';
        const pool = afterDot
          ? entries.filter((e) => e.kind === 'method')
          : entries.filter((e) => e.kind !== 'method');
        const suggestions: languages.CompletionItem[] = pool.map((e) => ({
          label: e.label,
          kind: kindMap[e.kind],
          insertText: e.insert ?? e.label,
          insertTextRules: e.snippet
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          detail: e.detail,
          documentation: e.doc ? { value: e.doc } : undefined,
          range,
        }));
        return { suggestions };
      },
    });
  }
}
