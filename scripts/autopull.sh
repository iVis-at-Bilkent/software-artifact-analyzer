#!/usr/bin/expect
# execute git pull and then enter username, personel access token using 'expect'
spawn ./scripts/gitpull.sh
expect -exact "Username for 'https://github.com': "
send -- "saanalyzer\r"
expect -exact "Password for 'https://saanalyzer@github.com':"
send -- "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\r"
expect eof
