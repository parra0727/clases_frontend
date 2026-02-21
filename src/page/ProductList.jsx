import { products } from '../data/products';
import ProductCard from '../components/ProductCard';
import styles from '../styles/ProductList.module.css';
import { useState } from 'react';

const STORAGE_KEY = "products";
 
function ProductList() {

    const [productsState, setProductsState] = useState(products);
 
     return (
        <div>
            {productsState.map((product) => (
            <ProductCard key={product.id} name={product.name} />
            ))}
        </div>
    );       
}
 
export default ProductList;