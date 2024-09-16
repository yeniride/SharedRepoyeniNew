import {
  FETCH_CAR_TYPES,
  FETCH_CAR_TYPES_SUCCESS,
  FETCH_CAR_TYPES_FAILED,
  EDIT_CAR_TYPE
} from "../store/types";
import store from '../store/store';

export const fetchCarTypes = () => (dispatch) => (firebase) => {

  const {
    carTypesRef
  } = firebase;

  dispatch({
    type: FETCH_CAR_TYPES,
    payload: null
  });
  carTypesRef.on("value", snapshot => {
    if (snapshot.val()) {
      let data = snapshot.val();
      const arr = Object.keys(data).map(i => {
        data[i].id = i;
        return data[i]
      });
      dispatch({
        type: FETCH_CAR_TYPES_SUCCESS,
        payload: arr
      });
    } else {
      dispatch({
        type: FETCH_CAR_TYPES_FAILED,
        payload: store.getState().languagedata.defaultLanguage.no_cars
      });
    }
  });
};

export const editCarType = (cartype, method) => (dispatch) => async (firebase) => {
  const {
    carTypesRef, 
    carTypesEditRef,
    carDocImage
  } = firebase;
  dispatch({
    type: EDIT_CAR_TYPE,
    payload: { method, cartype }
  });
  if (method === 'Add') {
    carTypesRef.push(cartype);
  } else if (method === 'Delete') {
    carTypesEditRef(cartype.id).remove();
  } else if (method === 'UpdateImage') {
    await carDocImage(cartype.id).put(cartype.image);
    let image = await carDocImage(cartype.id).getDownloadURL();
      let data = cartype;
      data.image = image;
    carTypesEditRef(cartype.id).set(data);
  }
   else {
    carTypesEditRef(cartype.id).set(cartype);
  }
}