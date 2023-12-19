#!/usr/bin/expect
# execute git pull and then enter username, personel access token using 'expect'
spawn ./gitpull.sh
expect -exact "Username for 'https://github.com': "
send -- "laramerdol\r"
expect -exact "Password for 'https://laramerdol@github.com':"
send -- "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\r"
expect eof
