/*
  handle UserData
*/

export function generateFakeData() {
  console.log("run generateFakeData");
  return (
    {"record_name":"user",
      "username":"jb@bevemyr.com",
      "password":"m9hbifDY23/6vX+X8iTF5A==",
      "sid":"1234567890",
      "confirmed":"true",
      "role":"admin",
      "passwd_reset_id":"",
      "passwd_reset_send_time":"0",
      "comment":"",
      "bookinguser":"johan@bevemyr.com",
      "bookingpass":"tentamen",
      "bookingname":"Johan",
      "bookingfull":"Bevemyr",
      "plan":[
        {"record_name":"plan","day":"monday","time":"19:30","type":"coach"},
        {"record_name":"plan","day":"tuesday","time":"19:00","type":"manned"},
        {"record_name":"plan","day":"wednesday","time":"19:00","type":"manned"},
        {"record_name":"plan","day":"thursday","time":"19:30","type":"coach"},
        {"record_name":"plan","day":"thursday","time":"18:45","type":"coach"},
        {"record_name":"plan","day":"saturday","time":"09:00","type":"coach"}
      ],
      "booked":[
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"19"},"time":"18:45"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"14"},"time":"09:00"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"12"},"time":"18:45"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"18"},"time":"19:00"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"17"},"time":"19:00"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"16"},"time":"19:30"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"11"},"time":"19:00"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"10"},"time":"19:00"},
        {"record_name":"booked","date":{"record_name":"date","year":"2019","month":"9","day":"9"},"time":"19:30"}
      ]
    }
  );
}

export function generateEmptyData() {
  //console.log("run generateEmptyData");
  return (
    {"record_name":"user",
      "bookinguser":"",
      "bookingpass":"",
      "bookingname":"",
      "bookingfull":"",
      "plan":[
      ],
      "booked":[
      ]
    }
  );
}


export function getBookingUser(sid) {
  console.log("getBookingUser: "+sid);
  const adr="http://crossfit.bevemyr.com/crossfit/get_user";
  const url=adr+"?sid="+sid;
  return fetch(url)
    .then((response) => {
      return response.json();
    })
    .catch((response) => {
      return null;
    });
}

export function setBookingUser(userdata) {
  let sid = userdata.sid;
  console.log("setBookingUser: "+sid);
  const adr="http://crossfit.bevemyr.com/crossfit/set_user";
  const url=adr+"?sid="+sid;
  return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userdata),
  })
    .then((response) => {
      return response.json();
    })
    .catch((response) => {
      return null;
    });
}

export function loginUser(username, passwd) {
  console.log("loginUser: "+username);
  const adr="http://crossfit.bevemyr.com/crossfit/login";
  const url=adr+"?user="+username+"&password="+passwd;
  return fetch(url)
    .then(response => response.json());
}
