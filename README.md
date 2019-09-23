## Formbase

A global, immutable database of Formality terms (i.e., proofs, code, theorems), capable of tracking imports (i.e., citations, references). It offers a simple public API:

- save_file(name, code): saves a file on the server, returns an unique name.

- load_file(unique_name): loads a file from the server.

- load_file_parents(unique_name): loads the list of files that import this one.
