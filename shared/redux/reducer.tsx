import { Ecommerceproducts, ProductProps } from "../data/apps/ecommerce/reduxdata";

// Action type constants
const ThemeChanger = "ThemeChanger";
const SET_SELECTED_ITEM = "SET_SELECTED_ITEM";
const ADD_TO_WISHLIST = "ADD_TO_WISHLIST";
const REMOVE_FROM_WISHLIST = "REMOVE_FROM_WISHLIST";
const Buynow_checkout = "Buynow_checkout";
const ADD_TO_CHECKOUT = "ADD_TO_CHECKOUT";
const ADD_TO_CART = "ADD_TO_CART";
const REMOVE_FROM_CART = "REMOVE_FROM_CART";
const UPDATE_CART_QUANTITY = "UPDATE_CART_QUANTITY";

// Interfaces


interface State {
    lang: string;
    dir: string;
    className: string;
    dataMenuStyles: string;
    dataNavLayout: string;
    dataHeaderStyles: string;
    dataVerticalStyle: string;
    toggled: string;
    dataNavStyle: string;
    dataPageStyle: string;
    dataWidth: string;
    dataMenuPosition: string;
    dataHeaderPosition: string;
    loader: string;
    iconOverlay: string;
    colorPrimaryRgb: string;
    colorPrimary: string;
    bodyBg: string;
    darkBg: string;
    gray: string;
    inputBorder: string;
    Light: string;
    bgImg: string;
    iconText: string;
    body: string;
    selectedItem: ProductProps | null;
    wishlist: ProductProps[];
    cart: ProductProps[];
    count: number;
    checkoutItems: ProductProps[];
    products: ProductProps[];
    actionType?: string;
}

type Action =
    | { type: typeof ThemeChanger; payload: Partial<State> }
    | { type: typeof SET_SELECTED_ITEM; payload: ProductProps }
    | { type: typeof ADD_TO_WISHLIST; payload: ProductProps }
    | { type: typeof REMOVE_FROM_WISHLIST; payload: number }
    | { type: typeof Buynow_checkout; payload: ProductProps; actionType?: string }
    | { type: typeof ADD_TO_CHECKOUT; payload: ProductProps[]; actionType?: string }
    | { type: typeof ADD_TO_CART; payload: ProductProps }
    | { type: typeof REMOVE_FROM_CART; payload: number }
    | { type: typeof UPDATE_CART_QUANTITY; payload: { id: number; quantity: number } };

// Initial state
const initialState: State = {
    lang: "en",
    dir: "ltr",
    className: "dark",
    dataMenuStyles: "dark",
    dataNavLayout: "vertical",
    dataHeaderStyles: "transparent",
    dataVerticalStyle: "overlay",
    toggled: "",
    dataNavStyle: "",
    dataPageStyle: "regular",
    dataWidth: "default",
    dataMenuPosition: "fixed",
    dataHeaderPosition: "fixed",
    loader: "disable",
    iconOverlay: "",
    colorPrimaryRgb: "",
    colorPrimary: "",
    bodyBg: "",
    darkBg: "",
    gray: "",
    inputBorder: "",
    Light: "",
    bgImg: "",
    iconText: "",
    body: "",
    selectedItem: null,
    wishlist: [],
    cart: [],
    count: 0,
    checkoutItems: [],
    products: Ecommerceproducts
};

// Reducer function
export default function reducer(state = initialState, action: Action): State {
    const { type, payload } = action;

    switch (type) {
        case ThemeChanger:
            return { ...state, ...payload };

        case SET_SELECTED_ITEM:
            return { ...state, selectedItem: payload };

        case ADD_TO_WISHLIST:
            return { ...state, wishlist: [...state.wishlist, payload] };

        case REMOVE_FROM_WISHLIST:
            return {
                ...state,
                wishlist: state.wishlist.filter(item => item.id !== payload)
            };

        case Buynow_checkout:
            return {
                ...state,
                cart: [payload],
                actionType: action.actionType
            };

        case ADD_TO_CHECKOUT:
            return {
                ...state,
                checkoutItems: payload,
                actionType: action.actionType
            };

        case ADD_TO_CART:
            return { ...state, cart: [...state.cart, payload] };

        case REMOVE_FROM_CART:
            return {
                ...state,
                cart: state.cart.filter(item => item.id !== payload)
            };

        case UPDATE_CART_QUANTITY:
            return {
                ...state,
                cart: state.cart.map(item =>
                    item.id === payload.id
                        ? { ...item, quantity: Math.max(0, payload.quantity) }
                        : item
                )
            };

        default:
            return state;
    }
}
