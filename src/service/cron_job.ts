import cron from 'node-cron';
import CroneJobController from '../controller/crone_job';
import { formateDate } from '../functions/product';

export const startCronJobs = () => {
    const couponSync = cron.createTask("*/15 * * * * ", CroneJobController.syncCoupons)
    // couponSync.start();
    // console.log(formateDate(couponSync.getNextRun() as Date));

    couponSync.stop()
};
