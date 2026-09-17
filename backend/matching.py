def normalize_tags(tags):
    cleaned = []
    for t in tags:     #tags is a list
        if t is None:
            continue      #skip any None entries
        t = t.strip().lower()   #strips whitespace AND convert to lowercase for each tab
        if t:      #empty strings are not appended
            cleaned.append(t)
    return set(cleaned)       #set removes the duplicates


def jaccard_similarity(tags_a, tags_b):
    set_a = normalize_tags(tags_a)
    set_b = normalize_tags(tags_b)  

    if not set_a or not set_b:
        return 0.0        #return 0 immediately to avoid division by 0 later

    intersection = set_a & set_b
    union = set_a | set_b

    if not union:
        return 0.0       #no similar tags (again return 0 to avoid division by 0)

    return round(len(intersection) / len(union), 4)       #gives jaccard similarity rounded to 4 decimal places


def rank_matches(my_tags, candidates):
    ranked = []
    for c in candidates:
        score = jaccard_similarity(my_tags, c["tags"])    #check your tags with candidate's tags
        if score > 0:     #skip candidates with score of 0   (never show prof with lower tags)
            c_copy = dict(c)
            c_copy["score"] = score
            ranked.append(c_copy)

    ranked.sort(key=lambda x: x["score"], reverse=True)      #sort in descending order
    return ranked
