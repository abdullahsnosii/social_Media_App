export interface IPaginate<T> {  // all user or all product or...

    count:number ;
    limit:number ;
    pages:number ;
    currentpage:number ;
    docs:T[] ;
}