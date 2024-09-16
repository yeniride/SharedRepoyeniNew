import React,{ useState, useEffect, useContext, useRef } from 'react';
import MaterialTable from 'material-table';
import {
  Grid,
  Typography,
  Button,
  Modal,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector, useDispatch } from "react-redux";
import { FirebaseContext } from 'common';
import { useTranslation } from "react-i18next";
import moment from 'moment/min/moment-with-locales';
import DashboardCard from '../components/DashboardCard';
import AlertDialog from '../components/AlertDialog';
import styles from "assets/jss/material-kit-react/views/landingPage.js";

const useStyles = makeStyles(theme => ({
  ...styles,
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  inputRtl: {
    "& label": {
      right: 25,
      left: "auto"
    },
    "& legend": {
      textAlign: "right",
      marginRight: 18
    }
  },
}));

const icons = {
  'paypal':require('../assets/img/payment-icons/paypal-logo.png').default,
  'braintree':require('../assets/img/payment-icons/braintree-logo.png').default,
  'stripe':require('../assets/img/payment-icons/stripe-logo.png').default,
  'paytm':require('../assets/img/payment-icons/paytm-logo.png').default,
  'payulatam':require('../assets/img/payment-icons/payulatam-logo.png').default,
  'flutterwave':require('../assets/img/payment-icons/flutterwave-logo.png').default,
  'paystack':require('../assets/img/payment-icons/paystack-logo.png').default,
  'securepay':require('../assets/img/payment-icons/securepay-logo.png').default,
  'payfast':require('../assets/img/payment-icons/payfast-logo.png').default,
  'liqpay':require('../assets/img/payment-icons/liqpay-logo.png').default,
  'culqi':require('../assets/img/payment-icons/culqi-logo.png').default,
  'mercadopago':require('../assets/img/payment-icons/mercadopago-logo.png').default,
  'squareup':require('../assets/img/payment-icons/squareup-logo.png').default,
  'wipay':require('../assets/img/payment-icons/wipay-logo.png').default,
  'razorpay':require('../assets/img/payment-icons/razorpay-logo.png').default,
  'test':require('../assets/img/payment-icons/test-logo.png').default
}


const UserWallet = (props) => {
  const { api } = useContext(FirebaseContext);
  const {
    updateWalletBalance,
    fetchProfile
  } = api;
  const dispatch = useDispatch();
  const classes = useStyles();
  const { t,i18n } = useTranslation();
  const isRTL = i18n.dir();
  const auth = useSelector(state => state.auth);
  const settings = useSelector(state => state.settingsdata.settings);
  const providers = useSelector(state => state.paymentmethods.providers);
  const [profile,setProfile] = useState();
  const [walletBalance, setWalletBalance] = useState(0);
  const [data,setData] = useState([]);
  const [commonAlert, setCommonAlert] = useState({ open: false, msg: '' });
  const rootRef = useRef(null);
  const [amount,setAmount] = useState(0);
  const [modalInfo,setModalInfo] = useState({
    mOpen: false,
    mType: null
  });
  const [selectedProvider, setSelectedProvider] = useState();
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const [paymentModalStatus, setPaymentModalStatus] = useState(false);
  const columns =  [
      { title: t('requestDate'), field: 'date', render: rowData => rowData.date ? moment(rowData.date).format('lll') : null,cellStyle:{textAlign:'center'},headerStyle:{textAlign:'center'} },
      { title: t('amount'), field: 'amount',editable: 'never',cellStyle:{textAlign:'center'},headerStyle:{textAlign:'center'}},
      { title: t('transaction_id'), field: 'transaction_id', cellStyle:{textAlign:'center'},headerStyle:{textAlign:'center'} },
      { title: t('type'), field: 'type', render: rowData => t(rowData.type),cellStyle:{textAlign:'center'},headerStyle:{textAlign:'center'} }
  ];

  useEffect(()=>{
    dispatch(fetchProfile());
  },[dispatch,fetchProfile]);

  useEffect(()=>{
    if(providers){
      setSelectedProvider(providers[0]);
    }
  },[providers]);

  useEffect(()=>{
    if(auth.info && auth.info.profile){
        setProfile(auth.info.profile);
        setWalletBalance(auth.info.profile.walletBalance);
        let wdata = auth.info.profile.walletHistory;
        var wallHis = [];
        for(let key in wdata){
            wdata[key].walletKey = key
            if(wdata[key].type.includes("Credit") || wdata[key].type.includes("credit")){
              wdata[key].type = 'credited'
            }else if(wdata[key].type.includes("Withdraw") || wdata[key].type.includes("withdraw")){
              wdata[key].type = 'withdraw'
            }else{
              wdata[key].type = 'debited'
            }
            wallHis.push(wdata[key])
        }
        if(wallHis.length>0){
          setData(wallHis.reverse());
        }else{
          setData([]);
        }

    } else{
        setProfile(null);
    }
  },[auth.info]);

  const doRecharge = (e) => {
    e.preventDefault();
    if(!(profile.mobile && profile.mobile.length > 6) || profile.email === ' ' || profile.firstName === ' ' || profile.lastName === ' ' ){
      setCommonAlert({ open: true, msg: t('profile_incomplete')})
      props.history.push('/profile');
     } else{
      if (providers) {
        setModalInfo({
          mOpen: true,
          mType: 'add'
        });
      } else {
        setCommonAlert({ open: true, msg: t('provider_not_found')})
      }
    }
  }

  const doWithdraw = (e) => {
    e.preventDefault();
    if(!(profile.mobile && profile.mobile.length > 6) || profile.email === ' ' || profile.firstName === ' ' || profile.lastName === ' ' ){
      setCommonAlert({ open: true, msg: t('profile_incomplete')})
      props.history.push('/profile');
    }else{
        if (parseFloat(auth.info.profile.walletBalance)>0) {
          setModalInfo({
            mOpen: true,
            mType: 'withdraw'
          });
        } else {
          setCommonAlert({ open: true, msg: t('wallet_zero')})
        }
    }
  }

  const cancelOperation = () => {
    setAmount(0);
    setModalInfo({
      mOpen: false,
      mType: null
    });
    setCommonAlert({ open: false, msg: '' })
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(amount <= 0){
      setCommonAlert({ open: true, msg: t('valid_amount')});
    } else {
       if(modalInfo.mType === 'add'){
        setModalInfo({
          ...modalInfo,
          mOpen: false
        });
        setPaymentModalStatus(true);
       }else{
        if( parseFloat(profile.walletBalance) < amount){
          setCommonAlert({ open: true, msg: t('valid_amount')});
        }else{
          let walletBalance = parseFloat(profile.walletBalance) - amount;
          let tDate = new Date();
          let details = {
            type: 'Withdraw',
            amount: amount,
            date: tDate.getTime(),
            txRef: tDate.getTime().toString(),
            transaction_id: tDate.getTime().toString()
          }
          dispatch(updateWalletBalance(walletBalance,details));
          cancelOperation();
          setTimeout(() => {
            dispatch(fetchProfile());
          }, 2000);
         }
        }
    }
  }

  const createOrderId = () =>{
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const reference = [...Array(4)].map(_ => c[~~(Math.random()*c.length)]).join('');
    return "wallet-" + auth.info.uid + "-" + reference
  }

  const handlePaymentModalClose = (e) => {
    setTimeout(()=>{
      setPaymentModalStatus(false);
    },1500);
  }

  
  return (
    <div>
      <Typography variant="h4" style={{margin:"20px 20px 20px 15px",textAlign:isRTL==='rtl'?'right':'left'}}>{t('my_wallet_tile')}</Typography>
      <Grid container direction="row" spacing={2}>
          <Grid item xs style={{textAlign:isRTL==='rtl'?'right':'left'}}>
              {settings.swipe_symbol===false?
                  <DashboardCard  title={t('wallet_balance')} image={require("../assets/img/money1.jpg").default}>{ settings.symbol + ' ' + walletBalance}</DashboardCard>
                  :
                  <DashboardCard title={t('wallet_balance')} image={require("../assets/img/money1.jpg").default}>{ walletBalance + ' ' + settings.symbol }</DashboardCard>
              }
          </Grid>
          <Grid item xs style={{textAlign:isRTL==='rtl'?'right':'left', display:'flex',  flexDirection:'row'}}>
              <Button onClick={doRecharge} variant="contained" style={{width:'100%', backgroundColor:'#4caf50', color:"white"}}  size='large'>{t('add_to_wallet')}</Button>
          </Grid>
          <Grid item xs style={{textAlign:isRTL==='rtl'?'right':'left', display:'flex',  flexDirection:'row'}}>
              <Button onClick={doWithdraw} variant="contained" style={{width:'100%', backgroundColor:'#00acc1', color:"white"}} size='large'>{t('withdraw')}</Button>
          </Grid>
      </Grid>
      <MaterialTable
        title={t('transaction_history_title')}
        style={{direction:isRTL ==='rtl'?'rtl':'ltr', padding: 10, marginTop: 30}}
        columns={columns}
        data={data}
        options={{
          exportButton: true
        }}
        localization={{
          toolbar: {
            searchPlaceholder: (t('search')),
            exportTitle: (t('export')),
          },
          pagination: {
            labelDisplayedRows: ('{from}-{to} '+ (t('of'))+ ' {count}'),
            labelRowsSelect: (t('rows')),
            firstTooltip: (t('first_page_tooltip')),
            previousTooltip: (t('previous_page_tooltip')),
            nextTooltip: (t('next_page_tooltip')),
            lastTooltip: (t('last_page_tooltip'))
          },
        }}

      />

      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        open={paymentModalStatus}
        onClose={handlePaymentModalClose}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <Grid container spacing={2} className={classes.paper}>
        {providers && selectedProvider && modalInfo.mType === 'add'  && amount>0?
          <form action={selectedProvider.link} method="POST">
            <input type='hidden' name='order_id' value={createOrderId()}/>
            <input type='hidden' name='amount' value={amount}/>
            <input type='hidden' name='currency' value={settings.code}/>
            <input type='hidden' name='product_name' value={t('add_money')}/>
            <input type='hidden' name='first_name' value={profile.firstName}/>
            <input type='hidden' name='last_name' value={profile.lastName}/>
            <input type='hidden' name='quantity' value={1}/>
            <input type='hidden' name='cust_id' value={auth.info.uid}/>
            <input type='hidden' name='mobile_no' value={profile.mobile}/>
            <input type='hidden' name='email' value={profile.email}/>
            <Grid item xs={12} sm={12} md={12} lg={12} style={{marginBottom: '20px'}}>
              <FormControl fullWidth>
              <FormLabel component="legend">{t('payment')}</FormLabel>
              <Select
                  id="selectedProviderIndex"
                  name= "selectedProviderIndex"
                  value={selectedProviderIndex}
                  label={t('payment')}
                  onChange={(e)=>{
                      setSelectedProviderIndex(parseInt(e.target.value));
                      setSelectedProvider(providers[parseInt(e.target.value)]);
                  }}
                  style={{textAlign:isRTL==='rtl'? 'right':'left'}}
                  inputProps={{ 'aria-label': 'Without label' }}
                >
                  {providers.map((provider,index) =>
                    <MenuItem key={provider.name} value={index}><img style={{height:24,margin:7}} src={icons[provider.name]} alt={provider.name}/> </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={12}>
            <Button onClick={handlePaymentModalClose} variant="contained" color="primary">
              {t('cancel')}
            </Button>
            <Button variant="contained" color="primary" type="submit" style={{marginLeft:10}} onClick={handlePaymentModalClose}>
              {t('paynow_button')}
            </Button>
            </Grid>
          </form>
          :null}
        </Grid>
      </Modal>

      <Modal
        disablePortal
        disableEnforceFocus
        disableAutoFocus
        open={modalInfo.mOpen}
        onClose={cancelOperation}
        className={classes.modal}
        container={() => rootRef.current}
      >
        <Grid container spacing={1} className={classes.paper} style={{direction:isRTL==='rtl'?'rtl':'ltr'}}>
            <Typography component="h2" variant="h5" style={{marginTop:15, color:'#000'}}>
                {t('amount')}
            </Typography>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="amount"
                label={t('amount')}
                name="amount"
                autoComplete="amount"
                onChange={(e)=>{
                  try{
                    if(e.target.value === ""){
                      setAmount(0);
                    }else{
                      setAmount(parseFloat(e.target.value));
                    }
                  }catch(e){
                    setCommonAlert({ open: true, msg: t('no_details_error')});
                    setAmount(0);
                  }          
                }}
                value={amount.toString()}
                autoFocus
                className={isRTL==='rtl'?classes.inputRtl:null}
                style={{direction:isRTL==='rtl'?'rtl':'ltr'}}
              />
            </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12} style={{textAlign:isRTL==='rtl'?'right':'left'}}>
            <Button onClick={cancelOperation} variant="contained" color="primary">
              {t('cancel')}
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary" style={{marginLeft:10}}>
              {modalInfo.mType === 'add'? t('add_to_wallet'): t('withdraw')}
            </Button>
          </Grid>
        </Grid>
      </Modal>
      <AlertDialog open={commonAlert.open} onClose={cancelOperation}>{commonAlert.msg}</AlertDialog>
    </div>
  );
}

export default UserWallet;
