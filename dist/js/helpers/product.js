var productsList = {};

var shopifyProduct = new (function () {
 
    function Product(handle) {
        this.handle = handle; 

        if (productsList[this.handle])
            this.product = productsList[this.handle];
        else 
            this.update(this.handle);
    } 

    Product.prototype.findVariantIdFromOptions = function (selectionOptionsArray) {
        for (let variant of this.product.variants) {
            let selectionOptionsStr = selectionOptionsArray.join(',').toLowerCase();
            let variantOptionsStr = variant.options.join(',').toLowerCase();
            if (selectionOptionsStr == variantOptionsStr)
              return variant.id;
        }
    
        return null;
    }

    Product.prototype.prepProduct = async function (product) {
        for (let i=0; i< product.options.length ; i++) {
            let option = product.options[i];
            option.values = [];
            // option = {name: 'size', position: 1}
    
            let positionIndex0 = option.position - 1;
    
            for (let variant of product.variants) {
              let variantOption = variant.options[positionIndex0];
              if (!option.values.includes(variantOption))
                option.values.push(variantOption);
            }
        }

        this.product = product;
        productsList[this.handle] = this.product;
    }

    Product.prototype.update = function (handle) {
        this.fetch(handle, this.prepProduct.bind(this));
    }

    Product.prototype.fetch = function (handle, productHandler) {
        fetch(`/products/${handle}.js`)
            .then(res => res.json())
            .then(productHandler)
            .catch(e => console.error("Couldn't fetch product", {handle}, e))
    }
  
    return Product;
})();