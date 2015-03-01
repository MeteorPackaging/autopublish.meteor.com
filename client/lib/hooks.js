/* global
  HookSearch: true,
  SearchSource: false
*/

HookSearch = new SearchSource('knownhooks', ['repoFullName'], {
  keepHistory: 1000 * 60 * 5,
  localSearch: false
});
