"""Container health check script."""

import sys
import urllib.request


def main() -> None:
    try:
        with urllib.request.urlopen("http://localhost:8020/api/v1/health/ready", timeout=5) as resp:
            if resp.status == 200:
                sys.exit(0)
    except Exception:
        pass
    sys.exit(1)


if __name__ == "__main__":
    main()
