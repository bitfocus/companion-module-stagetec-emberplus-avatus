# companion-module-stagetec-emberplus-avatus

Credits to the developers of the generic Ember+ module for the basis (https://github.com/bitfocus/companion-module-generic-emberplus)

Features:
- AutoParse any Ember+ device tree and filter for specific nodes and parameters.
- Set specific sub-paths for AutoParse to only scan nodes and parameters below subpath
- Set values of Ember+ Parameters and get feedback from Ember+ Parameters.
- Set specific paths to subscribe to Ember+ Parameters.
 
Differences to generic Ember+ module:
- Auto parsing of Ember+ tree available
- Additional actions available: increment, decrement, toggle boolean and set value with expression
- Additional feedbacks available: hit threshold, below threshold and boolean equal

## Getting started

Execute `yarn` command to install the dependencies.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn build:watch` the compiler will be run in watch mode to recompile the files on change.
