#!/usr/bin/expect
# execute git pull and then enter username, personel access token using 'expect'
spawn ./gitpull.sh
expect -exact "Username for 'https://github.com': "
send -- "saanalyzer\r"
expect -exact "Password for 'https://saanalyzer@github.com':"
send -- "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\r"
expect eof
