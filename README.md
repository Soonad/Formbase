## Formality Package Manager (FPM)

Right now, it is a very simple filesystem-based storage for raw files. The API offers 3 functionalities:

- save_file(name, code): saves a file on the server, returns an unique name.

- load_file(unique_name): loads a file from the server.

- load_file_parents(unique_name): loads the list of files that import this one.
