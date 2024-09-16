const fetch = require("node-fetch");
const admin = require('firebase-admin');

module.exports.UpdateBooking = (bookingData,order_id,transaction_id,gateway) => {
    let curChanges = {
        status: bookingData.paymentPacket.appcat === 'rentals'? 'ACCEPTED' : (bookingData.status === 'PAYMENT_PENDING' ? 'NEW' : 'PAID'),
        prepaid: bookingData.status === 'PAYMENT_PENDING' ||  bookingData.paymentPacket.appcat === 'rentals' ? true : false,
        transaction_id: transaction_id,
        gateway: gateway
    }
    Object.assign(curChanges, bookingData.paymentPacket);
    if(bookingData.paymentPacket.appcat === 'taxi' && bookingData.status === 'PENDING'){
        admin.database().ref('bookings').child(order_id).update(curChanges);
        if(parseFloat(bookingData.paymentPacket.usedWalletMoney)>0){
            deductFromWallet(bookingData.customer, bookingData.paymentPacket.usedWalletMoney , order_id);
        }
        addToWallet(bookingData.driver, bookingData.driver_share, order_id, order_id );
        admin.database().ref('users').child(bookingData.driver).update({queue:false});
    }
    if(bookingData.paymentPacket.appcat === 'delivery' && bookingData.status === 'PENDING'){
        admin.database().ref('bookings').child(order_id).update(curChanges);
        admin.database().ref('users').child(bookingData.driver).update({queue:false});
        addToWallet(bookingData.driver, bookingData.driver_share, order_id, order_id );
    }
    if(bookingData.paymentPacket.appcat === 'rentals' && bookingData.status === 'NEW'){
        curChanges.driver = bookingData.selectedBid.driver;
        curChanges.driver_image =  bookingData.selectedBid.driver_image; 
        curChanges.driver_name = bookingData.selectedBid.driver_name;
        curChanges.driver_contact = bookingData.selectedBid.driver_contact;
        curChanges.driver_token = bookingData.selectedBid.driver_token;
        curChanges.vehicle_number = bookingData.selectedBid.vehicle_number;
        curChanges.driverRating = bookingData.selectedBid.driverRating;
        curChanges.trip_cost =  bookingData.selectedBid.trip_cost;
        curChanges.convenience_fees =  bookingData.selectedBid.convenience_fees;
        curChanges.driver_share =  bookingData.selectedBid.driver_share;
        curChanges.driverOffers = {};
        curChanges.requestedDrivers = {};
        curChanges.selectedBid = {};

        admin.database().ref('bookings').child(order_id).update(curChanges);
        admin.database().ref('users').child(curChanges.driver).update({queue:true});
        if(parseFloat(bookingData.paymentPacket.usedWalletMoney)>0){
            deductFromWallet(bookingData.customer, bookingData.paymentPacket.usedWalletMoney , order_id);
        }
    }
    if(bookingData.paymentPacket.appcat === 'delivery' && bookingData.status === 'PAYMENT_PENDING'){
        admin.database().ref('bookings').child(order_id).update(curChanges);
        if(parseFloat(bookingData.paymentPacket.usedWalletMoney)>0){
            deductFromWallet(bookingData.customer, bookingData.paymentPacket.usedWalletMoney , order_id);
        }
    }
}

const RequestPushMsg = async (token, data) => {

    admin.database().ref('/users').orderByChild("pushToken").equalTo(token).once("value", (udata) => {
        let users = udata.val();
        if (users) {
            for (let ukey in users) {
                admin.database().ref('/users/' + ukey + '/notifications').push(
                    {
                         dated: new Date().getTime(), 
                         title: data.title, 
                         msg: data.msg
                    }
                )
            }
        }
    });

    const body = {
        "to": token,
        "title": data.title,
        "body": data.msg,
        "data": data,
        "priority": "high",
        "channelId": data.channelId? data.channelId: "messages",
        "_displayInForeground": true,
        "sound": "default",
    };

    if(data.ios && data.channelId){
        return true;
    } else {
        let response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'accept-encoding': 'gzip, deflate',
                'host': 'exp.host'
            },
            body: JSON.stringify(body)
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            return await response.json()
        }
    }
}

module.exports.RequestPushMsg = RequestPushMsg;

const addToWallet = async (uid,amount,description,transaction_id) =>{
    let snapshot =  await admin.database().ref("users/" + uid).once("value");
    if (snapshot.val()) {
        const pushToken = snapshot.val().pushToken;
        let walletBalance = parseFloat(snapshot.val().walletBalance);
        walletBalance = walletBalance + parseFloat(amount);
        let details = {
            type: 'Credit',
            amount: amount,
            date: new Date().getTime(),
            txRef: description,
            transaction_id: transaction_id? transaction_id : ''
        }
        await admin.database().ref("users/" + uid + "/walletBalance").set(walletBalance);
        await admin.database().ref("users/" + uid + "/walletHistory").push(details);
        if(pushToken){
            const language = Object.values((await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value')).val())[0].keyValuePairs;
            RequestPushMsg(
                pushToken, 
                {
                    title: language.notification_title, 
                    msg: language.wallet_updated,
                    screen: 'Wallet'
                }
            );
        }  
        return true;
    }else{
        return false;
    }
}

module.exports.addToWallet = addToWallet;

const deductFromWallet = async (uid,amount,description) =>{
    let snapshot =  await admin.database().ref("users/" + uid).once("value");
    if (snapshot.val()) {
        const pushToken = snapshot.val().pushToken;
        let walletBalance = parseFloat(snapshot.val().walletBalance);
        walletBalance = walletBalance - parseFloat(amount);
        let details = {
            type: 'Debit',
            amount: amount,
            date: new Date().getTime(),
            txRef: description,
            transaction_id: description
        }
        await admin.database().ref("users/" + uid + "/walletBalance").set(walletBalance);
        await admin.database().ref("users/" + uid + "/walletHistory").push(details);
        if(pushToken){
            const language = Object.values((await admin.database().ref("languages").orderByChild("default").equalTo(true).once('value')).val())[0].keyValuePairs;
            RequestPushMsg(
                pushToken, 
                {
                    title: language.notification_title, 
                    msg: language.wallet_updated,
                    screen: 'Wallet'
                }
            );
        }  
        return true;
    }else{
        return false;
    }
}

module.exports.deductFromWallet = deductFromWallet;


module.exports.getDistance = (lat1, lon1, lat2, lon2) => {
    if ((lat1 === lat2) && (lon1 === lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist;
    }
}