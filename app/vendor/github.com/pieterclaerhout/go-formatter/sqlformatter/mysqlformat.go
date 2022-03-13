package sqlformatter

import "strings"

func isAlpha(b byte) bool {
	return (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z')
}

func isXdigit(b byte) bool {
	return (b >= '0' && b <= '9') || (b >= 'a' && b <= 'f') || (b >= 'A' && b <= 'F')
}

func isAlnum(b byte) bool {
	return (b >= '0' && b <= '9') || (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z')
}

func isDigit(b byte) bool {
	return b >= '0' && b <= '9'
}

func isNumeric(b byte) bool {
	return (b >= '0' && b <= '9') || b == '.'
}

func isQuote(b byte) bool {
	return b == '\'' || b == '"' || b == '`'
}

type token struct {
	value     string
	tokenType int
}

const tokenString = 0
const tokenName = 1
const tokenNumeric = 2
const tokenOperator = 3
const tokenWord = 4
const tokenFunction = 5
const tokenBinary = 6
const tokenNewline = 7
const tokenSystem = 8

const queryUnset = 0
const queryInsert = 1
const queryOther = 2

var operators = map[byte]struct{}{
	'!': {},
	'%': {},
	'&': {},
	'*': {},
	'+': {},
	',': {},
	'-': {},
	'.': {},
	'/': {},
	':': {},
	'<': {},
	'=': {},
	'>': {},
	'^': {},
	'|': {},
	'~': {},
	';': {},
	'(': {},
	')': {},
	'?': {},
}

var keywords = map[string]struct{}{
	"accessible":         {},
	"account":            {},
	"action":             {},
	"add":                {},
	"after":              {},
	"against":            {},
	"aggregate":          {},
	"algorithm":          {},
	"all":                {},
	"alter":              {},
	"always":             {},
	"analyse":            {},
	"analyze":            {},
	"and":                {},
	"any":                {},
	"as":                 {},
	"asc":                {},
	"ascii":              {},
	"asensitive":         {},
	"at":                 {},
	"autoextend_size":    {},
	"auto_increment":     {},
	"avg":                {},
	"avg_row_length":     {},
	"backup":             {},
	"before":             {},
	"begin":              {},
	"between":            {},
	"bigint":             {},
	"binary":             {},
	"binlog":             {},
	"bit":                {},
	"blob":               {},
	"block":              {},
	"bool":               {},
	"boolean":            {},
	"both":               {},
	"btree":              {},
	"by":                 {},
	"byte":               {},
	"cache":              {},
	"call":               {},
	"cascade":            {},
	"cascaded":           {},
	"case":               {},
	"catalog_name":       {},
	"chain":              {},
	"change":             {},
	"changed":            {},
	"channel":            {},
	"char":               {},
	"character":          {},
	"charset":            {},
	"check":              {},
	"checksum":           {},
	"cipher":             {},
	"class_origin":       {},
	"client":             {},
	"close":              {},
	"coalesce":           {},
	"code":               {},
	"collate":            {},
	"collation":          {},
	"column":             {},
	"columns":            {},
	"column_format":      {},
	"column_name":        {},
	"comment":            {},
	"commit":             {},
	"committed":          {},
	"compact":            {},
	"completion":         {},
	"compressed":         {},
	"compression":        {},
	"concurrent":         {},
	"condition":          {},
	"connection":         {},
	"consistent":         {},
	"constraint":         {},
	"constraint_catalog": {},
	"constraint_name":    {},
	"constraint_schema":  {},
	"contains":           {},
	"context":            {},
	"continue":           {},
	"convert":            {},
	"cpu":                {},
	"create":             {},
	"cross":              {},
	"cube":               {},
	"current":            {},
	"current_date":       {},
	"current_time":       {},
	"current_timestamp":  {},
	"current_user":       {},
	"cursor":             {},
	"cursor_name":        {},
	"data":               struct{}{}, "database": struct{}{}, "databases": struct{}{}, "datafile": struct{}{}, "date": struct{}{}, "datetime": struct{}{}, "day": struct{}{}, "day_hour": struct{}{}, "day_microsecond": struct{}{}, "day_minute": struct{}{}, "day_second": struct{}{}, "deallocate": struct{}{}, "dec": struct{}{}, "decimal": struct{}{}, "declare": struct{}{}, "default": struct{}{}, "default_auth": struct{}{}, "definer": struct{}{}, "delayed": struct{}{}, "delay_key_write": struct{}{}, "delete": struct{}{}, "desc": struct{}{}, "describe": struct{}{}, "des_key_file": struct{}{}, "deterministic": struct{}{}, "diagnostics": struct{}{}, "directory": struct{}{}, "disable": struct{}{}, "discard": struct{}{}, "disk": struct{}{}, "distinct": struct{}{}, "distinctrow": struct{}{}, "div": struct{}{}, "do": struct{}{}, "double": struct{}{}, "drop": struct{}{}, "dual": struct{}{}, "dumpfile": struct{}{}, "duplicate": struct{}{}, "dynamic": struct{}{}, "each": struct{}{}, "else": struct{}{}, "elseif": struct{}{}, "enable": struct{}{}, "enclosed": struct{}{}, "encryption": struct{}{}, "end": struct{}{}, "ends": struct{}{}, "engine": struct{}{}, "engines": struct{}{}, "enum": struct{}{}, "error": struct{}{}, "errors": struct{}{}, "escape": struct{}{}, "escaped": struct{}{}, "event": struct{}{}, "events": struct{}{}, "every": struct{}{}, "exchange": struct{}{}, "execute": struct{}{}, "exists": struct{}{}, "exit": struct{}{}, "expansion": struct{}{}, "expire": struct{}{}, "explain": struct{}{}, "export": struct{}{}, "extended": struct{}{}, "extent_size": struct{}{}, "false": struct{}{}, "fast": struct{}{}, "faults": struct{}{}, "fetch": struct{}{}, "fields": struct{}{}, "file": struct{}{}, "file_block_size": struct{}{}, "filter": struct{}{}, "first": struct{}{}, "fixed": struct{}{}, "float": struct{}{}, "float4": struct{}{}, "float8": struct{}{}, "flush": struct{}{}, "follows": struct{}{}, "for": struct{}{}, "force": struct{}{}, "foreign": struct{}{}, "format": struct{}{}, "found": struct{}{}, "from": struct{}{}, "full": struct{}{}, "fulltext": struct{}{}, "function": struct{}{}, "general": struct{}{}, "generated": struct{}{}, "geometry": struct{}{}, "geometrycollection": struct{}{}, "get": struct{}{}, "get_format": struct{}{}, "global": struct{}{}, "grant": struct{}{}, "grants": struct{}{}, "group": struct{}{}, "group_replication": struct{}{}, "handler": struct{}{}, "hash": struct{}{}, "having": struct{}{}, "help": struct{}{}, "high_priority": struct{}{}, "host": struct{}{}, "hosts": struct{}{}, "hour": struct{}{}, "hour_microsecond": struct{}{}, "hour_minute": struct{}{}, "hour_second": struct{}{}, "identified": struct{}{}, "if": struct{}{}, "ignore": struct{}{}, "ignore_server_ids": struct{}{}, "import": struct{}{}, "in": struct{}{}, "index": struct{}{}, "indexes": struct{}{}, "infile": struct{}{}, "initial_size": struct{}{}, "inner": struct{}{}, "inout": struct{}{}, "insensitive": struct{}{}, "insert": struct{}{}, "insert_method": struct{}{}, "install": struct{}{}, "instance": struct{}{}, "int": struct{}{}, "int1": struct{}{}, "int2": struct{}{}, "int3": struct{}{}, "int4": struct{}{}, "int8": struct{}{}, "integer": struct{}{}, "interval": struct{}{}, "into": struct{}{}, "invoker": struct{}{}, "io": struct{}{}, "io_after_gtids": struct{}{}, "io_before_gtids": struct{}{}, "io_thread": struct{}{}, "ipc": struct{}{}, "is": struct{}{}, "isolation": struct{}{}, "issuer": struct{}{}, "iterate": struct{}{}, "join": struct{}{}, "json": struct{}{}, "key": struct{}{}, "keys": struct{}{}, "key_block_size": struct{}{}, "kill": struct{}{}, "language": struct{}{}, "last": struct{}{}, "leading": struct{}{}, "leave": struct{}{}, "leaves": struct{}{}, "left": struct{}{}, "less": struct{}{}, "level": struct{}{}, "like": struct{}{}, "limit": struct{}{}, "linear": struct{}{}, "lines": struct{}{}, "linestring": struct{}{}, "list": struct{}{}, "load": struct{}{}, "local": struct{}{}, "localtime": struct{}{}, "localtimestamp": struct{}{}, "lock": struct{}{}, "locks": struct{}{}, "logfile": struct{}{}, "logs": struct{}{}, "long": struct{}{}, "longblob": struct{}{}, "longtext": struct{}{}, "loop": struct{}{}, "low_priority": struct{}{}, "master": struct{}{}, "master_auto_position": struct{}{}, "master_bind": struct{}{}, "master_connect_retry": struct{}{}, "master_delay": struct{}{}, "master_heartbeat_period": struct{}{}, "master_host": struct{}{}, "master_log_file": struct{}{}, "master_log_pos": struct{}{}, "master_password": struct{}{}, "master_port": struct{}{}, "master_retry_count": struct{}{}, "master_server_id": struct{}{}, "master_ssl": struct{}{}, "master_ssl_ca": struct{}{}, "master_ssl_capath": struct{}{}, "master_ssl_cert": struct{}{}, "master_ssl_cipher": struct{}{}, "master_ssl_crl": struct{}{}, "master_ssl_crlpath": struct{}{}, "master_ssl_key": struct{}{}, "master_ssl_verify_server_cert": struct{}{}, "master_tls_version": struct{}{}, "master_user": struct{}{}, "match": struct{}{}, "maxvalue": struct{}{}, "max_connections_per_hour": struct{}{}, "max_queries_per_hour": struct{}{}, "max_rows": struct{}{}, "max_size": struct{}{}, "max_statement_time": struct{}{}, "max_updates_per_hour": struct{}{}, "max_user_connections": struct{}{}, "medium": struct{}{}, "mediumblob": struct{}{}, "mediumint": struct{}{}, "mediumtext": struct{}{}, "memory": struct{}{}, "merge": struct{}{}, "message_text": struct{}{}, "microsecond": struct{}{}, "middleint": struct{}{}, "migrate": struct{}{}, "minute": struct{}{}, "minute_microsecond": struct{}{}, "minute_second": struct{}{}, "min_rows": struct{}{}, "mod": struct{}{}, "mode": struct{}{}, "modifies": struct{}{}, "modify": struct{}{}, "month": struct{}{}, "multilinestring": struct{}{}, "multipoint": struct{}{}, "multipolygon": struct{}{}, "mutex": struct{}{}, "mysql_errno": struct{}{}, "name": struct{}{}, "names": struct{}{}, "national": struct{}{}, "natural": struct{}{}, "nchar": struct{}{}, "ndb": struct{}{}, "ndbcluster": struct{}{}, "never": struct{}{}, "new": struct{}{}, "next": struct{}{}, "no": struct{}{}, "nodegroup": struct{}{}, "nonblocking": struct{}{}, "none": struct{}{}, "not": struct{}{}, "no_wait": struct{}{}, "no_write_to_binlog": struct{}{}, "null": struct{}{}, "number": struct{}{}, "numeric": struct{}{}, "nvarchar": struct{}{}, "offset": struct{}{}, "old_password": struct{}{}, "on": struct{}{}, "one": struct{}{}, "only": struct{}{}, "open": struct{}{}, "optimize": struct{}{}, "optimizer_costs": struct{}{}, "option": struct{}{}, "optionally": struct{}{}, "options": struct{}{}, "or": struct{}{}, "order": struct{}{}, "out": struct{}{}, "outer": struct{}{}, "outfile": struct{}{}, "owner": struct{}{}, "pack_keys": struct{}{}, "page": struct{}{}, "parser": struct{}{}, "parse_gcol_expr": struct{}{}, "partial": struct{}{}, "partition": struct{}{}, "partitioning": struct{}{}, "partitions": struct{}{}, "password": struct{}{}, "phase": struct{}{}, "plugin": struct{}{}, "plugins": struct{}{}, "plugin_dir": struct{}{}, "point": struct{}{}, "polygon": struct{}{}, "port": struct{}{}, "precedes": struct{}{}, "precision": struct{}{}, "prepare": struct{}{}, "preserve": struct{}{}, "prev": struct{}{}, "primary": struct{}{}, "privileges": struct{}{}, "procedure": struct{}{}, "processlist": struct{}{}, "profile": struct{}{}, "profiles": struct{}{}, "proxy": struct{}{}, "purge": struct{}{}, "quarter": struct{}{}, "query": struct{}{}, "quick": struct{}{}, "range": struct{}{}, "read": struct{}{}, "reads": struct{}{}, "read_only": struct{}{}, "read_write": struct{}{}, "real": struct{}{}, "rebuild": struct{}{}, "recover": struct{}{}, "redofile": struct{}{}, "redo_buffer_size": struct{}{}, "redundant": struct{}{}, "references": struct{}{}, "regexp": struct{}{}, "relay": struct{}{}, "relaylog": struct{}{}, "relay_log_file": struct{}{}, "relay_log_pos": struct{}{}, "relay_thread": struct{}{}, "release": struct{}{}, "reload": struct{}{}, "remove": struct{}{}, "rename": struct{}{}, "reorganize": struct{}{}, "repair": struct{}{}, "repeat": struct{}{}, "repeatable": struct{}{}, "replace": struct{}{}, "replicate_do_db": struct{}{}, "replicate_do_table": struct{}{}, "replicate_ignore_db": struct{}{}, "replicate_ignore_table": struct{}{}, "replicate_rewrite_db": struct{}{}, "replicate_wild_do_table": struct{}{}, "replicate_wild_ignore_table": struct{}{}, "replication": struct{}{}, "require": struct{}{}, "reset": struct{}{}, "resignal": struct{}{}, "restore": struct{}{}, "restrict": struct{}{}, "resume": struct{}{}, "return": struct{}{}, "returned_sqlstate": struct{}{}, "returns": struct{}{}, "reverse": struct{}{}, "revoke": struct{}{}, "right": struct{}{}, "rlike": struct{}{}, "rollback": struct{}{}, "rollup": struct{}{}, "rotate": struct{}{}, "routine": struct{}{}, "row": struct{}{}, "rows": struct{}{}, "row_count": struct{}{}, "row_format": struct{}{}, "rtree": struct{}{}, "savepoint": struct{}{}, "schedule": struct{}{}, "schema": struct{}{}, "schemas": struct{}{}, "schema_name": struct{}{}, "second": struct{}{}, "second_microsecond": struct{}{}, "security": struct{}{}, "select": struct{}{}, "sensitive": struct{}{}, "separator": struct{}{}, "serial": struct{}{}, "serializable": struct{}{}, "server": struct{}{}, "session": struct{}{}, "set": struct{}{}, "share": struct{}{}, "show": struct{}{}, "shutdown": struct{}{}, "signal": struct{}{}, "signed": struct{}{}, "simple": struct{}{}, "slave": struct{}{}, "slow": struct{}{}, "smallint": struct{}{}, "snapshot": struct{}{}, "socket": struct{}{}, "some": struct{}{}, "soname": struct{}{}, "sounds": struct{}{}, "source": struct{}{}, "spatial": struct{}{}, "specific": struct{}{}, "sql": struct{}{}, "sqlexception": struct{}{}, "sqlstate": struct{}{}, "sqlwarning": struct{}{}, "sql_after_gtids": struct{}{}, "sql_after_mts_gaps": struct{}{}, "sql_before_gtids": struct{}{}, "sql_big_result": struct{}{}, "sql_buffer_result": struct{}{}, "sql_cache": struct{}{}, "sql_calc_found_rows": struct{}{}, "sql_no_cache": struct{}{}, "sql_small_result": struct{}{}, "sql_thread": struct{}{}, "sql_tsi_day": struct{}{}, "sql_tsi_hour": struct{}{}, "sql_tsi_minute": struct{}{}, "sql_tsi_month": struct{}{}, "sql_tsi_quarter": struct{}{}, "sql_tsi_second": struct{}{}, "sql_tsi_week": struct{}{}, "sql_tsi_year": struct{}{}, "ssl": struct{}{}, "stacked": struct{}{}, "start": struct{}{}, "starting": struct{}{}, "starts": struct{}{}, "stats_auto_recalc": struct{}{}, "stats_persistent": struct{}{}, "stats_sample_pages": struct{}{}, "status": struct{}{}, "stop": struct{}{}, "storage": struct{}{}, "stored": struct{}{}, "straight_join": struct{}{}, "string": struct{}{}, "subclass_origin": struct{}{}, "subject": struct{}{}, "subpartition": struct{}{}, "subpartitions": struct{}{}, "super": struct{}{}, "suspend": struct{}{}, "swaps": struct{}{}, "switches": struct{}{}, "table": struct{}{}, "tables": struct{}{}, "tablespace": struct{}{}, "table_checksum": struct{}{}, "table_name": struct{}{}, "temporary": struct{}{}, "temptable": struct{}{}, "terminated": struct{}{}, "text": struct{}{}, "than": struct{}{}, "then": struct{}{}, "time": struct{}{}, "timestamp": struct{}{}, "timestampadd": struct{}{}, "timestampdiff": struct{}{}, "tinyblob": struct{}{}, "tinyint": struct{}{}, "tinytext": struct{}{}, "to": struct{}{}, "trailing": struct{}{}, "transaction": struct{}{}, "trigger": struct{}{}, "triggers": struct{}{}, "true": struct{}{}, "truncate": struct{}{}, "type": struct{}{}, "types": struct{}{}, "uncommitted": struct{}{}, "undefined": struct{}{}, "undo": struct{}{}, "undofile": struct{}{}, "undo_buffer_size": struct{}{}, "unicode": struct{}{}, "uninstall": struct{}{}, "union": struct{}{}, "unique": struct{}{}, "unknown": struct{}{}, "unlock": struct{}{}, "unsigned": struct{}{}, "until": struct{}{}, "update": struct{}{}, "upgrade": struct{}{}, "usage": struct{}{}, "use": struct{}{}, "user": struct{}{}, "user_resources": struct{}{}, "use_frm": struct{}{}, "using": struct{}{}, "utc_date": struct{}{}, "utc_time": struct{}{}, "utc_timestamp": struct{}{}, "validation": struct{}{}, "value": struct{}{}, "values": struct{}{}, "varbinary": struct{}{}, "varchar": struct{}{}, "varcharacter": struct{}{}, "variables": struct{}{}, "varying": struct{}{}, "view": struct{}{}, "virtual": struct{}{}, "wait": struct{}{}, "warnings": struct{}{}, "week": struct{}{}, "weight_string": struct{}{}, "when": struct{}{}, "where": struct{}{}, "while": struct{}{}, "with": struct{}{}, "without": struct{}{}, "work": struct{}{}, "wrapper": struct{}{}, "write": struct{}{}, "x509": struct{}{}, "xa": struct{}{}, "xid": struct{}{}, "xml": struct{}{}, "xor": struct{}{}, "year": struct{}{}, "year_month": struct{}{}, "zerofill": struct{}{}}
var functions = map[string]struct{}{"rand": struct{}{}, "st_geomcollfromtext": struct{}{}, "left": struct{}{}, "pow": struct{}{}, "procedure": struct{}{}, "st_numpoints": struct{}{}, "inet_aton": struct{}{}, "ln": struct{}{}, "mpolyfromwkb": struct{}{}, "st_geometryfromwkb": struct{}{}, "bit_length": struct{}{}, "st_geometrycollectionfromwkb": struct{}{}, "polygon": struct{}{}, "sin": struct{}{}, "abs": struct{}{}, "json_extract": struct{}{}, "month": struct{}{}, "group_concat": struct{}{}, "is_free_lock": struct{}{}, "mbrtouches": struct{}{}, "regexp": struct{}{}, "st_geomcollfromtxt": struct{}{}, "linefromwkb": struct{}{}, "md5": struct{}{}, "mlinefromwkb": struct{}{}, "st_distance": struct{}{}, "timestamp": struct{}{}, "yearweek": struct{}{}, "get_format": struct{}{}, "polygonfromwkb": struct{}{}, "st_within": struct{}{}, "acos": struct{}{}, "datediff": struct{}{}, "name_const": struct{}{}, "stddev": struct{}{}, "monthname": struct{}{}, "st_endpoint": struct{}{}, "st_geometrycollectionfromtext": struct{}{}, "endpoint": struct{}{}, "if": struct{}{}, "st_distance_sphere": struct{}{}, "st_geohash": struct{}{}, "version": struct{}{}, "curdate": struct{}{}, "mbroverlaps": struct{}{}, "st_aswkb": struct{}{}, "overlaps": struct{}{}, "date": struct{}{}, "json_length": struct{}{}, "st_linestringfromwkb": struct{}{}, "uuid": struct{}{}, "cot": struct{}{}, "crosses": struct{}{}, "system_user": struct{}{}, "st_envelope": struct{}{}, "char": struct{}{}, "convert_tz": struct{}{}, "date_sub": struct{}{}, "multipolygonfromtext": struct{}{}, "octet_length": struct{}{}, "extractvalue": struct{}{}, "isclosed": struct{}{}, "st_buffer": struct{}{}, "st_exteriorring": struct{}{}, "weight_string": struct{}{}, "json_contains_path": struct{}{}, "json_quote": struct{}{}, "mbrdisjoint": struct{}{}, "st_isempty": struct{}{}, "sounds": struct{}{}, "srid": struct{}{}, "st_geomfromwkb": struct{}{}, "bit_or": struct{}{}, "centroid": struct{}{}, "json_set": struct{}{}, "geometryfromwkb": struct{}{}, "to_base64": struct{}{}, "bit_count": struct{}{}, "coalesce": struct{}{}, "dayofyear": struct{}{}, "curtime": struct{}{}, "day": struct{}{}, "glength": struct{}{}, "ifnull": struct{}{}, "st_geometryn": struct{}{}, "adddate": struct{}{}, "cast": struct{}{}, "create_dh_parameters": struct{}{}, "to_seconds": struct{}{}, "benchmark": struct{}{}, "least": struct{}{}, "degrees": struct{}{}, "nullif": struct{}{}, "json_insert": struct{}{}, "lower": struct{}{}, "maketime": struct{}{}, "pointn": struct{}{}, "stddev_pop": struct{}{}, "log10": struct{}{}, "geometrycollection": struct{}{}, "or": struct{}{}, "bit_xor": struct{}{}, "multilinestring": struct{}{}, "sysdate": struct{}{}, "isnull": struct{}{}, "rlike": struct{}{}, "mbrwithin": struct{}{}, "bin": struct{}{}, "is_used_lock": struct{}{}, "substr": struct{}{}, "aes_encrypt": struct{}{}, "database": struct{}{}, "null": struct{}{}, "right": struct{}{}, "st_issimple": struct{}{}, "disjoint": struct{}{}, "encode": struct{}{}, "geomcollfromwkb": struct{}{}, "st_geomcollfromwkb": struct{}{}, "isempty": struct{}{}, "json_pretty": struct{}{}, "time": struct{}{}, "time_format": struct{}{}, "charset": struct{}{}, "json_objectagg": struct{}{}, "st_astext": struct{}{}, "is_ipv6": struct{}{}, "json_array_insert": struct{}{}, "asbinary": struct{}{}, "inet6_ntoa": struct{}{}, "rtrim": struct{}{}, "password": struct{}{}, "uncompress": struct{}{}, "old_password": struct{}{}, "power": struct{}{}, "release_all_locks": struct{}{}, "st_srid": struct{}{}, "time_to_sec": struct{}{}, "from_days": struct{}{}, "json_unquote": struct{}{}, "multipoint": struct{}{}, "utc_date": struct{}{}, "st_union": struct{}{}, "substring_index": struct{}{}, "uncompressed_length": struct{}{}, "is_ipv4_compat": struct{}{}, "mbrcontains": struct{}{}, "st_contains": struct{}{}, "st_y": struct{}{}, "json_depth": struct{}{}, "soundex": struct{}{}, "st_multilinestringfromtext": struct{}{}, "to_days": struct{}{}, "json_arrayagg": struct{}{}, "st_centroid": struct{}{}, "tan": struct{}{}, "current_date": struct{}{}, "st_simplify": struct{}{}, "weekofyear": struct{}{}, "st_crosses": struct{}{}, "timestampadd": struct{}{}, "max": struct{}{}, "pointfromwkb": struct{}{}, "st_buffer_strategy": struct{}{}, "export_set": struct{}{}, "format": struct{}{}, "mbrintersects": struct{}{}, "values": struct{}{}, "and": struct{}{}, "des_encrypt": struct{}{}, "st_numinteriorrings": struct{}{}, "repeat": struct{}{}, "sha": struct{}{}, "sha2": struct{}{}, "st_numinteriorring": struct{}{}, "avg": struct{}{}, "between": struct{}{}, "geometrycollectionfromwkb": struct{}{}, "var_pop": struct{}{}, "from_unixtime": struct{}{}, "last_insert_id": struct{}{}, "numinteriorrings": struct{}{}, "json_keys": struct{}{}, "makedate": struct{}{}, "startpoint": struct{}{}, "exp": struct{}{}, "ord": struct{}{}, "trim": struct{}{}, "y": struct{}{}, "year": struct{}{}, "gtid_subset": struct{}{}, "lpad": struct{}{}, "mbrcovers": struct{}{}, "st_overlaps": struct{}{}, "asymmetric_verify": struct{}{}, "quote": struct{}{}, "st_multipolygonfromwkb": struct{}{}, "linefromtext": struct{}{}, "multilinestringfromwkb": struct{}{}, "st_geometrytype": struct{}{}, "insert": struct{}{}, "coercibility": struct{}{}, "convert": struct{}{}, "radians": struct{}{}, "st_area": struct{}{}, "st_polygonfromwkb": struct{}{}, "st_isvalid": struct{}{}, "timediff": struct{}{}, "replace": struct{}{}, "st_intersects": struct{}{}, "subdate": struct{}{}, "asymmetric_decrypt": struct{}{}, "is_ipv4_mapped": struct{}{}, "json_merge_preserve": struct{}{}, "utc_time": struct{}{}, "crc32": struct{}{}, "min": struct{}{}, "point": struct{}{}, "var_samp": struct{}{}, "log2": struct{}{}, "st_intersection": struct{}{}, "st_mlinefromwkb": struct{}{}, "gtid_subtract": struct{}{}, "now": struct{}{}, "astext": struct{}{}, "asymmetric_encrypt": struct{}{}, "date_add": struct{}{}, "st_linestringfromtext": struct{}{}, "st_touches": struct{}{}, "is": struct{}{}, "addtime": struct{}{}, "decode": struct{}{}, "equals": struct{}{}, "master_pos_wait": struct{}{}, "asin": struct{}{}, "ceiling": struct{}{}, "create_digest": struct{}{}, "std": struct{}{}, "like": struct{}{}, "st_asgeojson": struct{}{}, "st_polyfromwkb": struct{}{}, "json_merge": struct{}{}, "json_search": struct{}{}, "polyfromwkb": struct{}{}, "dayofmonth": struct{}{}, "json_remove": struct{}{}, "rpad": struct{}{}, "sec_to_time": struct{}{}, "st_mlinefromtext": struct{}{}, "ceil": struct{}{}, "concat": struct{}{}, "geometrytype": struct{}{}, "st_startpoint": struct{}{}, "des_decrypt": struct{}{}, "sqrt": struct{}{}, "strcmp": struct{}{}, "current_user": struct{}{}, "position": struct{}{}, "st_x": struct{}{}, "str_to_date": struct{}{}, "collation": struct{}{}, "sign": struct{}{}, "st_multipolygonfromtext": struct{}{}, "st_mpointfromwkb": struct{}{}, "weekday": struct{}{}, "atan": struct{}{}, "character_length": struct{}{}, "cos": struct{}{}, "in": struct{}{}, "json_valid": struct{}{}, "row_count": struct{}{}, "mbrequal": struct{}{}, "numpoints": struct{}{}, "release_lock": struct{}{}, "st_geomfromtext": struct{}{}, "ascii": struct{}{}, "multilinestringfromtext": struct{}{}, "st_dimension": struct{}{}, "localtime": struct{}{}, "st_linefromtext": struct{}{}, "variance": struct{}{}, "json_append": struct{}{}, "json_object": struct{}{}, "st_multilinestringfromwkb": struct{}{}, "match": struct{}{}, "mbrcoveredby": struct{}{}, "st_mpolyfromwkb": struct{}{}, "st_pointfromwkb": struct{}{}, "substring": struct{}{}, "updatexml": struct{}{}, "current_time": struct{}{}, "json_array": struct{}{}, "st_aswkt": struct{}{}, "validate_password_strength": struct{}{}, "area": struct{}{}, "field": struct{}{}, "interiorringn": struct{}{}, "st_multipointfromtext": struct{}{}, "week": struct{}{}, "count": struct{}{}, "json_merge_patch": struct{}{}, "connection_id": struct{}{}, "conv": struct{}{}, "subtime": struct{}{}, "st_numgeometries": struct{}{}, "user": struct{}{}, "period_diff": struct{}{}, "pointfromtext": struct{}{}, "st_longfromgeohash": struct{}{}, "localtimestamp": struct{}{}, "mpointfromtext": struct{}{}, "asymmetric_derive": struct{}{}, "last_day": struct{}{}, "linestringfromwkb": struct{}{}, "analyse": struct{}{}, "timestampdiff": struct{}{}, "case": struct{}{}, "linestringfromtext": struct{}{}, "microsecond": struct{}{}, "geomfromtext": struct{}{}, "st_length": struct{}{}, "aes_decrypt": struct{}{}, "buffer": struct{}{}, "floor": struct{}{}, "geomfromwkb": struct{}{}, "mid": struct{}{}, "st_pointn": struct{}{}, "not": struct{}{}, "mpointfromwkb": struct{}{}, "x": struct{}{}, "multipointfromtext": struct{}{}, "polyfromtext": struct{}{}, "geomcollfromtext": struct{}{}, "hex": struct{}{}, "st_latfromgeohash": struct{}{}, "any_value": struct{}{}, "asymmetric_sign": struct{}{}, "dimension": struct{}{}, "random_bytes": struct{}{}, "sleep": struct{}{}, "st_disjoint": struct{}{}, "truncate": struct{}{}, "uuid_short": struct{}{}, "geometrycollectionfromtext": struct{}{}, "json_type": struct{}{}, "mpolyfromtext": struct{}{}, "find_in_set": struct{}{}, "instr": struct{}{}, "locate": struct{}{}, "greatest": struct{}{}, "xor": struct{}{}, "char_length": struct{}{}, "numgeometries": struct{}{}, "create_asymmetric_pub_key": struct{}{}, "st_pointfromgeohash": struct{}{}, "st_polyfromtext": struct{}{}, "atan2": struct{}{}, "div": struct{}{}, "pi": struct{}{}, "compress": struct{}{}, "st_mpointfromtext": struct{}{}, "st_pointfromtext": struct{}{}, "touches": struct{}{}, "issimple": struct{}{}, "minute": struct{}{}, "session_user": struct{}{}, "st_isclosed": struct{}{}, "aswkt": struct{}{}, "is_ipv4": struct{}{}, "json_storage_size": struct{}{}, "dayofweek": struct{}{}, "st_geometryfromtext": struct{}{}, "st_symdifference": struct{}{}, "st_equals": struct{}{}, "st_makeenvelope": struct{}{}, "st_validate": struct{}{}, "ucase": struct{}{}, "binary": struct{}{}, "encrypt": struct{}{}, "round": struct{}{}, "second": struct{}{}, "geometryfromtext": struct{}{}, "lcase": struct{}{}, "quarter": struct{}{}, "st_convexhull": struct{}{}, "from_base64": struct{}{}, "sha1": struct{}{}, "upper": struct{}{}, "convexhull": struct{}{}, "exteriorring": struct{}{}, "sum": struct{}{}, "oct": struct{}{}, "period_add": struct{}{}, "utc_timestamp": struct{}{}, "concat_ws": struct{}{}, "json_contains": struct{}{}, "mbrequals": struct{}{}, "multipolygonfromwkb": struct{}{}, "st_multipointfromwkb": struct{}{}, "unhex": struct{}{}, "envelope": struct{}{}, "extract": struct{}{}, "mod": struct{}{}, "json_replace": struct{}{}, "st_polygonfromtext": struct{}{}, "st_mpolyfromtext": struct{}{}, "wait_until_sql_thread_after_gtids": struct{}{}, "within": struct{}{}, "current_timestamp": struct{}{}, "ltrim": struct{}{}, "st_asbinary": struct{}{}, "elt": struct{}{}, "intersects": struct{}{}, "length": struct{}{}, "load_file": struct{}{}, "mlinefromtext": struct{}{}, "bit_and": struct{}{}, "contains": struct{}{}, "create_asymmetric_priv_key": struct{}{}, "reverse": struct{}{}, "st_interiorringn": struct{}{}, "st_linefromwkb": struct{}{}, "wait_for_executed_gtid_set": struct{}{}, "distance": struct{}{}, "inet6_aton": struct{}{}, "polygonfromtext": struct{}{}, "aswkb": struct{}{}, "get_lock": struct{}{}, "make_set": struct{}{}, "multipolygon": struct{}{}, "st_geomfromgeojson": struct{}{}, "stddev_samp": struct{}{}, "unix_timestamp": struct{}{}, "hour": struct{}{}, "interval": struct{}{}, "linestring": struct{}{}, "multipointfromwkb": struct{}{}, "date_format": struct{}{}, "found_rows": struct{}{}, "geometryn": struct{}{}, "json_array_append": struct{}{}, "log": struct{}{}, "space": struct{}{}, "dayname": struct{}{}, "st_difference": struct{}{}, "default": struct{}{}, "inet_ntoa": struct{}{}, "schema": struct{}{}}

var newlineKeywords = map[string]struct{}{"from": struct{}{}, "group": struct{}{}, "order": struct{}{}, "and": struct{}{}, "or": struct{}{}, "where": struct{}{}, "limit": struct{}{}, "having": struct{}{}, "inner": struct{}{}, "cross": struct{}{}, "full": struct{}{}, "when": struct{}{}, "set": struct{}{}, "end": struct{}{}, "force": struct{}{}, "union": struct{}{}, "straight_join": struct{}{}, "natural": struct{}{}}
var newlineOperators = map[byte]struct{}{',': struct{}{}}

func isOperator(b byte) bool {
	_, ok := operators[b]
	return ok
}

func Format(mysql string) string {

	newMySQL := ""
	maxLineLength := 250

	currentLineLength := 0

	lastNewlineOperatorPosition := 0

	lastNewlineOperatorTabs := 0

	currentQuery := queryUnset
	insertUpdate := false

	tokens := make([]token, 0)
	newToken := false
	t := 0

	p := 0

	addNewline := func(space bool) {
		if space {
			newMySQL += " "
		}

		newMySQL += "\n"

		maxLineLength = 250

		currentLineLength = 0
		lastNewlineOperatorPosition = 0

		if p > 0 {
			spaces := strings.Repeat(" ", p*4)
			newMySQL += spaces
		}
	}

	var i int
	l := len(mysql)

	for i < l {
		newToken = false

		switch b := mysql[i]; {
		case isAlpha(b):
			s := i
			for i+1 < l && (isAlnum(mysql[i+1]) || mysql[i+1] == '_') {
				i++
			}

			word := mysql[s : i+1]
			lword := strings.ToLower(word)

			_, isFunction := functions[lword]

			tokenType := tokenName
			if isFunction && i+1 < l && mysql[i] == '(' {
				tokenType = tokenFunction
				word = lword
			} else if _, ok := keywords[lword]; ok {
				tokenType = tokenWord
				word = lword
			} else if isFunction {
				tokenType = tokenFunction
				word = lword
			}

			if tokenType != tokenWord || word != "as" {
				newToken = true
				t++
				tokens = append(tokens, token{value: word, tokenType: tokenType})
			}
		case isQuote(b):
			q := mysql[i]
			i++
			s := i
			for i+1 < l && mysql[i] != q {
				if i+2 < l && mysql[i] == '\\' {
					i++
				}
				i++
			}

			tokenType := tokenString
			if mysql[i] == '`' {
				tokenType = tokenName
			}

			value := mysql[s:i]
			value = strings.Replace(value, "\\"+string(q), string(q), -1)

			newToken = true
			t++
			tokens = append(tokens, token{value: value, tokenType: tokenType})
		case i+2 < l && b == '@' && mysql[i+1] == '@' && isAlnum(mysql[i+2]):
			s := i
			i += 2
			for i+1 < l && (isAlnum(mysql[i+1]) || mysql[i+1] == '_') {
				i++
			}

			newToken = true
			t++
			tokens = append(tokens, token{value: mysql[s : i+1], tokenType: tokenSystem})
		case (isNumeric(b) && b != '.') || (b == '.' && ((i > 0 && isDigit(mysql[i-1])) || (i+1 < l && isDigit(mysql[i+1])))):
			s := i

			tokenType := tokenNumeric

			if i+1 < l {
				if mysql[i+1] == 'x' {
					i++
					tokenType = tokenBinary
					for i+1 < l && isXdigit(mysql[i+1]) {
						i++
					}
				} else {
					for i+1 < l && isNumeric(mysql[i+1]) {
						i++
					}
				}
			}

			tokenValue := string(mysql[s : i+1])
			if tokenType == tokenBinary {
				tokenValue = strings.ToLower(tokenValue)
			}

			newToken = true
			t++
			tokens = append(tokens, token{value: tokenValue, tokenType: tokenType})
		case isOperator(b):
			newToken = true
			t++
			tokens = append(tokens, token{value: string(mysql[i]), tokenType: tokenOperator})
		}

		if newToken {
			currentToken := tokens[t-1]
			var previousToken token
			hasPreviousToken := t-2 >= 0
			if hasPreviousToken {
				previousToken = tokens[t-2]
			}

			if currentQuery == queryUnset && currentToken.tokenType == tokenWord {
				if currentToken.value == "insert" {
					currentQuery = queryInsert
				} else {
					currentQuery = queryOther
				}
			}

			newString := ""

			switch currentToken.tokenType {
			case tokenOperator:
				newString += currentToken.value

				if currentQuery == queryInsert && p == 0 && currentToken.value == "(" && !insertUpdate {
					addNewline(false)
				}

				if currentToken.value == "(" {
					p++
				} else if currentToken.value == ")" {
					p--
				}
			case tokenWord, tokenFunction, tokenNumeric, tokenBinary, tokenSystem:
				space := false
				if hasPreviousToken && (previousToken.tokenType == tokenWord || previousToken.tokenType == tokenFunction ||
					previousToken.tokenType == tokenNumeric || previousToken.tokenType == tokenBinary || previousToken.tokenType == tokenSystem) {
					currentLineLength++
					space = true
				}

				if hasPreviousToken && currentToken.tokenType == tokenWord {
					if _, ok := newlineKeywords[currentToken.value]; ok ||
						(currentToken.value == "join" && (previousToken.tokenType != tokenWord ||
							(previousToken.value != "inner" && previousToken.value != "cross" &&
								previousToken.value != "left" && previousToken.value != "right" &&
								previousToken.value != "outer" && previousToken.value != "natural"))) ||
						((currentToken.value == "left" || currentToken.value == "right") &&
							(previousToken.tokenType != tokenWord || previousToken.value != "natural")) ||
						(currentToken.value == "outer" && (previousToken.tokenType != tokenWord ||
							(previousToken.value != "left" && previousToken.value != "right"))) ||
						(currentQuery == queryInsert && (currentToken.value == "on" || currentToken.value == "select")) {
						addNewline(space)
						space = false
					}

					if currentQuery == queryInsert && currentToken.value == "select" {
						currentQuery = queryOther
					}
				}

				if space {
					newString += " "
				}

				newString += currentToken.value
			case tokenName:
				if hasPreviousToken && previousToken.tokenType == tokenName {
					currentLineLength++
					newString += " "
				}

				newString += /*"`" +*/ currentToken.value /*+ "`"*/
			case tokenString:
				if hasPreviousToken && previousToken.tokenType == tokenString {
					currentLineLength++
					newString += " "
				}

				slashesRemoved := strings.Replace(currentToken.value, `'`, `\'`, -1)

				newString += "'" + slashesRemoved + "'"
			}

			newStringLen := len(newString)

			if newStringLen > 0 {

				if lastNewlineOperatorPosition > 0 && currentLineLength+newStringLen > maxLineLength {
					if lastNewlineOperatorTabs > 0 {
						newMySQL = newMySQL[:lastNewlineOperatorPosition] + "\n" + strings.Repeat(" ", lastNewlineOperatorTabs*4) + newMySQL[lastNewlineOperatorPosition:]
					} else {
						newMySQL = newMySQL[:lastNewlineOperatorPosition] + "\n" + newMySQL[lastNewlineOperatorPosition:]
					}
					currentLineLength = len(newMySQL) - lastNewlineOperatorPosition
					lastNewlineOperatorPosition = 0
				}

				if currentToken.tokenType == tokenOperator && currentToken.value == "," {
					lastNewlineOperatorPosition = len(newMySQL) + 1
					lastNewlineOperatorTabs = p
				}

				currentLineLength += newStringLen
				newMySQL += newString

				if currentQuery == queryInsert && !insertUpdate && currentToken.tokenType == tokenWord && currentToken.value == "update" {
					insertUpdate = true
					addNewline(false)
				}
			}
		}

		i++
	}

	return newMySQL

}
