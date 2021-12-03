from struct import pack

filename = "/etc/hostid"
hostid = pack("I", int("0xdc0a5b8d",16))
open(filename, "wb").write(hostid)
