import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51I7IErBXx3WNioRsI0vnwX4HU1dg95SaGnxr56s1JmulfkdF7chWJ3BLwT7AS1IDxIyGzpuC6fIJKS7iAFzZgvfj00zyVIBi42');

export const bookTour = async tourId => {
    try{
        // 1] Get the chcekout session from server
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)

        // console.log(session);
        // 2] Create checkout form + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })

    }catch(err){
        console.log(err);
        showAlert('error', err);
    }

}