def normalize_tags(tags):
    cleaned = []
    for t in tags:
        if t is None:
            continue
        t = t.strip().lower()
        if t:
            cleaned.append(t)
    return set(cleaned)


def jaccard_similarity(tags_a, tags_b):
    set_a = normalize_tags(tags_a)
    set_b = normalize_tags(tags_b)

    if not set_a or not set_b:
        return 0.0

    intersection = set_a & set_b
    union = set_a | set_b

    if not union:
        return 0.0

    return round(len(intersection) / len(union), 4)


def rank_matches(my_tags, candidates):
    ranked = []
    for c in candidates:
        score = jaccard_similarity(my_tags, c["tags"])
        if score > 0:
            c_copy = dict(c)
            c_copy["score"] = score
            ranked.append(c_copy)

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked
