import sys

# Windows console: force UTF-8 so emoji in logs don't crash, WITHOUT replacing
# the stream objects. Reassigning sys.stdout/stderr breaks pytest's output
# capture and any captured pipe / embedding; reconfigure() keeps the same
# objects and only changes the encoding.
if sys.platform == "win32":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
