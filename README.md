# bendchess.github.io
A static website for the Bend Chess & Go Club.

Serve the site locally:

```
docker run --net host --rm --volume "$(pwd):/srv/jekyll:Z" -it jekyll/jekyll:4.0 jekyll serve -P 8080
```
