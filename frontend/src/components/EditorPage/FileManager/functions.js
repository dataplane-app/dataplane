export function findNodeById(nodes, id, callback) {
    let res;

    function findNode(nodes, id) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].id === id) {
                res = nodes[i];
                // you can also use callback back here for more options ;)
                // callback(nodes[i]);
                break;
            }
            if (nodes[i].children) {
                findNode(nodes[i].children, id);
            }
        }
    }

    findNode(nodes, id);

    return res;
}

export function findNodeByName(nodes, name, callback) {
    let res;

    function findNode(nodes, name) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].name === name) {
                res = nodes[i];
                // you can also use callback back here for more options ;)
                // callback(nodes[i]);
                break;
            }
            if (nodes[i].children) {
                findNode(nodes[i].children, name);
            }
        }
    }

    findNode(nodes, name);

    return res;
}

export function getParentId(array, id, parentId) {
    return array.some((o) => o.id === id || (o.children && (parentId = getParentId(o.children, id, o.id)) !== null)) ? parentId : null;
}

export function getPath(object, id) {
    if (object.id === id) return [object.name];
    else if (object.children || Array.isArray(object)) {
        let children = Array.isArray(object) ? object : object.children;
        for (let child of children) {
            let result = getPath(child, id);
            if (result) {
                if (object.id) result.unshift(object.name);
                return result;
            }
        }
    }
}

export function isFolder(selected, data) {
    if (!selected) return;

    const selectedInfo = findNodeById(data.children, selected);
    if (selectedInfo) {
        if (selectedInfo.children) {
            // Is folder\
            return true;
        } else {
            return false;
        }
    }
}

export function removeById(arr, targetId) {
    return arr.reduce(
        (acc, obj) =>
            obj.id === targetId
                ? acc
                : [
                      ...acc,
                      {
                          ...obj,
                          ...(obj.children && { children: removeById(obj.children, targetId) }),
                      },
                  ],
        []
    );
}
