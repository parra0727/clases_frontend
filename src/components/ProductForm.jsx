import { useEffect, useState } from 'react';

import styles from '../styles/ProductForm.module.css';

const emptyValues = {
  name: '',
  categoryId: '',
  price: '',
  stock: '',
  image: '',
  description: '',
};

function ProductForm({
  initialValues,
  onSubmit,
  onCancel,
  categories = [],
  isEditing = false,
  isSubmitting = false,
  submitError = '',
}) {
  const [values, setValues] = useState(emptyValues);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fallbackCategory = categories.find(
      (category) =>
        category.id === Number(initialValues?.categoryId) ||
        category.name === (initialValues?.categoryName ?? initialValues?.category)
    );

    if (initialValues) {
      setValues({
        name: initialValues.name ?? '',
        categoryId: String(initialValues.categoryId ?? fallbackCategory?.id ?? ''),
        price: initialValues.price ?? '',
        stock: initialValues.stockQty ?? initialValues.stock ?? '',
        image: initialValues.image ?? '',
        description: initialValues.description ?? '',
      });
    } else {
      setValues(emptyValues);
    }

    setFormError('');
  }, [categories, initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (formError) {
      setFormError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = values.name.trim();
    const image = values.image.trim();
    const description = values.description.trim();
    const categoryId = Number(values.categoryId);
    const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;

    const price = Number(values.price);
    const stock = Number(values.stock);

    const parsedRating = Number(initialValues?.rating ?? 3);
    const rating = Number.isFinite(parsedRating) ? Math.min(5, Math.max(1, parsedRating)) : 3;

    if (!name) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    if (!selectedCategory) {
      setFormError('Selecciona una categoría válida.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Ingresa un precio válido mayor a 0.');
      return;
    }

    if (!Number.isFinite(stock) || stock < 0) {
      setFormError('Ingresa un stock válido igual o mayor a 0.');
      return;
    }

    setFormError('');

    const result = await onSubmit({
      ...initialValues,
      name,
      categoryId,
      categoryName: selectedCategory.name,
      category: selectedCategory.name,
      price,
      stockQty: stock,
      stock,
      image,
      description,
      rating,
      isActive: initialValues?.isActive ?? true,
    });

    if (!isEditing && result?.ok !== false) {
      setValues(emptyValues);
    }

    if (!result?.ok) {
      setFormError(result?.error ?? 'No fue posible guardar el producto.');
    }
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>{isEditing ? 'Editar producto' : 'Agregar producto'}</h2>
        <p className={styles.subtitle}>Completa el formulario y guarda los cambios.</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            disabled={isSubmitting}
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Ej: Teclado gamer"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <select
            className={styles.input}
            disabled={isSubmitting || categories.length === 0}
            name="categoryId"
            value={values.categoryId}
            onChange={handleChange}
          >
            <option value="">Selecciona una categoría</option>
            {categories
              .filter((category) => category.id != null && category.id > 0)
              .map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Precio</span>
            <input
              className={styles.input}
              disabled={isSubmitting}
              name="price"
              type="number"
              min="1"
              value={values.price}
              onChange={handleChange}
              placeholder="Ej: 199990"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Stock</span>
            <input
              className={styles.input}
              disabled={isSubmitting}
              name="stock"
              type="number"
              min="0"
              value={values.stock}
              onChange={handleChange}
              placeholder="Ej: 10"
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Imagen (URL opcional)</span>
          <input
            className={styles.input}
            disabled={isSubmitting}
            name="image"
            value={values.image}
            onChange={handleChange}
            placeholder="https://... (opcional)"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>
          <textarea
            className={styles.textarea}
            disabled={isSubmitting}
            name="description"
            value={values.description}
            onChange={handleChange}
            placeholder="Describe el producto..."
            rows={3}
          />
        </label>

        {formError || submitError ? (
          <p className={styles.error}>{formError || submitError}</p>
        ) : null}

        <div className={styles.actions}>
          {onCancel ? (
            <button
              className={styles.btnSecondary}
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          ) : null}

          <button className={styles.btnPrimary} type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? 'Guardando...'
                : 'Agregando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Agregar producto'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ProductForm;
