def rabin_karp_search(text, pattern):
    text    = text.lower()
    pattern = pattern.lower()
    d, q    = 256, 101
    n, m    = len(text), len(pattern)

    if m > n:
        return []

    h = pow(d, m - 1, q)
    p = t = 0

    for i in range(m):
        p = (d * p + ord(pattern[i])) % q
        t = (d * t + ord(text[i]))    % q

    positions = []
    for i in range(n - m + 1):
        if p == t:
            if text[i:i + m] == pattern:
                positions.append(i)
        if i < n - m:
            t = (d * (t - ord(text[i]) * h) + ord(text[i + m])) % q
            if t < 0:
                t += q

    return positions